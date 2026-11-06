import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'**/*.e2e.ts',timeout:90000,workers:1,use:{baseURL:process.env.ONTO_PREVIEW_URL??'http://127.0.0.1:5174',channel:'chrome',headless:true,viewport:{width:1600,height:1000},trace:'retain-on-failure'},reporter:[['list'],['html',{open:'never'}]],outputDir:'test-results'});
