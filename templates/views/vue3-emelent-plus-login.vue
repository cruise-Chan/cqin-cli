<template>
    <div class="login-container">
      <el-card class="login-box">
        <h2 class="text-center">用户登录</h2>
        <el-form>
          <el-form-item label="用户名">
            <el-input v-model="form.username" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" type="password" />
          </el-form-item>
          <el-button type="primary" class="w-full">登录</el-button>
        </el-form>
      </el-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive } from 'vue'
  
  const form = reactive({
    username: '',
    password: ''
  })
  </script>
  
  <style scoped>
  .login-container {
    @apply h-screen flex items-center justify-center bg-gray-100;
  }
  .login-box {
    width: 400px;
  }
  </style>