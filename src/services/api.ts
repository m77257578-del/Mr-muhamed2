const BASE_URL = '';

function getDeviceId() {
  try {
    let id = localStorage.getItem('x-device-id');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
      localStorage.setItem('x-device-id', id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

export const tokens = {
  get student() {
    try {
      return localStorage.getItem('st') || sessionStorage.getItem('st') || '';
    } catch {
      return '';
    }
  },
  set student(v: string) {
    try {
      if (v) {
        localStorage.setItem('st', v);
        sessionStorage.setItem('st', v);
      } else {
        localStorage.removeItem('st');
        sessionStorage.removeItem('st');
      }
    } catch {}
  },
  get parent() {
    try {
      return localStorage.getItem('pt') || sessionStorage.getItem('pt') || '';
    } catch {
      return '';
    }
  },
  set parent(v: string) {
    try {
      if (v) {
        localStorage.setItem('pt', v);
        sessionStorage.setItem('pt', v);
      } else {
        localStorage.removeItem('pt');
        sessionStorage.removeItem('pt');
      }
    } catch {}
  },
  get teacher() {
    try {
      return localStorage.getItem('tt') || sessionStorage.getItem('tt') || '';
    } catch {
      return '';
    }
  },
  set teacher(v: string) {
    try {
      if (v) {
        localStorage.setItem('tt', v);
        sessionStorage.setItem('tt', v);
      } else {
        localStorage.removeItem('tt');
        sessionStorage.removeItem('tt');
      }
    } catch {}
  },
};

export async function apiRequest<T = any>(
  role: 'student' | 'parent' | 'teacher' | 'public',
  url: string,
  body?: any,
  method?: string
): Promise<T> {
  const token = role === 'public' ? '' : tokens[role];
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-device-id': getDeviceId(),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    method: method || (body === undefined ? 'GET' : 'POST'),
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch (e) {
    // ignore
  }

  if (!response.ok) {
    const errorMsg = data?.error || 'حدث خطأ في الاتصال بالخادم';
    const err: any = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  return data as T;
}

export async function uploadFile(
  url: string,
  file: File,
  onProgress?: (ratio: number) => void
): Promise<{ fileId: string; fileName: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = tokens.teacher || tokens.student || tokens.parent;
    const fullUrl = `${BASE_URL}${url}${url.includes('?') ? '&' : '?'}name=${encodeURIComponent(file.name)}`;
    xhr.open('PUT', fullUrl);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('x-device-id', getDeviceId());

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded / e.total);
      }
    };

    xhr.onload = () => {
      let json: any = {};
      try {
        json = JSON.parse(xhr.responseText);
      } catch (e) {
        // ignore
      }
      if (xhr.status < 300) {
        if (onProgress) onProgress(1);
        resolve(json);
      } else {
        reject(new Error(json.error || 'فشل رفع الملف'));
      }
    };

    xhr.onerror = () => reject(new Error('انقطع الاتصال أثناء الرفع'));
    xhr.send(file);
  });
}
