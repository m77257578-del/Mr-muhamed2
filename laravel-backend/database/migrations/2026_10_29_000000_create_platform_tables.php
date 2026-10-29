<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('student_code')->unique();
            $table->string('name');
            $table->string('phone')->unique();
            $table->string('grade');
            $table->string('governorate')->nullable();
            $table->decimal('wallet_balance', 10, 2)->default(0);
            $table->string('password');
            $table->timestamps();
        });

        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('grade');
            $table->decimal('price', 8, 2)->default(0);
            $table->boolean('is_free')->default(false);
            $table->string('status')->default('published');
            $table->timestamps();
        });

        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->integer('days')->default(30);
            $table->string('status')->default('unused');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('coupons');
    }
};
