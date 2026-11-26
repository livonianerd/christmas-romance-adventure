import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir:'tests', testMatch:'*.spec.js', timeout:135000,
  workers:3, fullyParallel:true,
  use:{
    baseURL:'https://example.test/christmas-romance-adventure/',
    viewport:{width:1280,height:850},
    ...(process.env.CHROMIUM_PATH ? {launchOptions:{ executablePath:process.env.CHROMIUM_PATH }} : {})
  }
});
