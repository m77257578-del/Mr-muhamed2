const BASE_URL = '';

export const tokens = {
  get student() {
    return sessionStorage.getItem('st') || '';
  },
  set student(v: string) {
    if (v) sessionStorage.setItem('st', v);
    else sessionStorage.removeItem('st');
  },
  get parent() {
    return sessionStorage.getItem('pt') || '';
  },
  set parent(v: string) {
    if (v) sessionStorage.setItem('pt', v);
    else sessionStorage.removeItem('pt');
  },
  get teacher() {
    return sessionStorage.getItem('tt') || '';
  },
  set teacher(v: string) {
    if (v) sessionStorage.setItem('tt', v);
    else sessionStorage.removeItem('tt');
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
