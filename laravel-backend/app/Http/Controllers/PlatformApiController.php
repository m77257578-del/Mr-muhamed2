<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Course;
use App\Models\Coupon;

class PlatformApiController extends Controller
{
    public function getPublicData(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'platform' => 'منصة الأستاذ محمد - Laravel API Bridge',
            'courses' => Course::where('status', 'published')->get(),
            'timestamp' => now()
        ]);
    }

    public function authenticateStudent(Request $request)
    {
        $credentials = $request->only('phone', 'password');
        
        $student = Student::where('phone', $credentials['phone'])->first();
        
        if (!$student || !password_verify($credentials['password'], $student->password)) {
            return response()->json(['error' => 'رقم الهاتف أو كلمة السر غير صحيحة'], 401);
        }

        $token = $student->createToken('student-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'role' => 'student',
            'student' => $student
        ]);
    }

    public function verifyCoupon(Request $request)
    {
        $code = $request->input('code');
        $coupon = Coupon::where('code', $code)->where('status', 'unused')->first();

        if (!$coupon) {
            return response()->json(['error' => 'الكود غير صحيح أو مستخدم من قبل'], 400);
        }

        return response()->json([
            'success' => true,
            'coupon' => $coupon
        ]);
    }
}
