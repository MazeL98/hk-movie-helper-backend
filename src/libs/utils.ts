import * as cp from 'child_process';
import {resolve} from 'path';

import Qiniu from 'qiniu';
import { nanoid } from 'nanoid'
 
interface startCrawlerProcessOptions {
  path: string;
  message: (data:any) => void;
  exit: (code:any) => void;
  error: (err:any) => void;
}

export function   startCrawlerProcess(options:startCrawlerProcessOptions) { 
  const script = resolve(__dirname,options.path)
  const child = cp.fork(script,[])

  let invoked = false;
  const cleanup = () => {
    child.removeListener('message', messageHandler);
    child.removeListener('exit', exitHandler);
    child.removeListener('error', errorHandler);
  };

  const messageHandler = (data:any) => {
    options.message(data)
  } 

  const exitHandler = (code:any) => {
    if(invoked) return;
    invoked = true;
   options.exit(code);
   cleanup();
  }

  const errorHandler = (err:any) => {
    if(invoked) return;
    invoked = true;
    options.error(err)
    cleanup();
  }


  child.on('message',messageHandler )
  child.on('exit',exitHandler)
  child.on('error',errorHandler)
  child.on('disconnect',() =>{
    console.log('与父进程的 IPC 连接已断开，子进程正在退出...');
    options.exit(0);
    cleanup();
  })
  child.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，子进程正在优雅退出...');
    cleanup();
    process.exit(0);
  });
}

/**
 *  url: 资源源地址
 *  bucket: 空间名称
 * ext: 待上传文件的后缀
 */
interface QiniuUploadOptions {
  url: string;
  bucket: string;
  ext: string;
  access_key:string;
  secret_key:string;
}

// 准备好七牛云服务器的上传参数
// 调用七牛云官方提供的上传API
export function qiniuUpload(options: QiniuUploadOptions): Promise<{data:string}> {
  const mac = new Qiniu.auth.digest.Mac(options.access_key,options.secret_key),
  conf = new Qiniu.conf.Config({
    zone: Qiniu.zone.Zone_z2  // 华东区域
  }),
  client = new Qiniu.rs.BucketManager(mac,conf),
  key =  nanoid() + options.ext;
  return new Promise((resolve,reject) =>{
      client.fetch(options.url,options.bucket,key,(error,res,info) =>{
        if(error) {
          reject(error)
        } else {
          if(info.statusCode === 200) {
            resolve({data:key})
          } else {
            reject(info)
          }
        }
      })
   
    }
  )
}

import { spawn } from "child_process";
import fs from "fs";

let chromeStarted = false;


export const launchChromeOnce = () => {
    if (chromeStarted) Promise.resolve();
    return new Promise((resolve, reject) => {
        const chromePath =
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
        const userDataDir = "C:\\temp\\chrome-profile";
        // Ensure the profile dir exists (optional but recommended)
        if (!fs.existsSync(userDataDir)) {
            fs.mkdirSync(userDataDir, { recursive: true });
        }
        const args = [
            "--remote-debugging-port=9999",
            `--user-data-dir=${userDataDir}`,
            "--no-first-run",
            "--no-default-browser-check",
        ];
        console.log("[ChromeLauncher] Launching Chrome...");
        try {
            const chrome = spawn(chromePath, args, {
                detached: true,
                stdio: "ignore",
            });
            chrome.unref();
            chromeStarted = true;
            setTimeout(() => {
                console.log("[Chrome] Remote debugging launched on port 9999");
                resolve("success");
            }, 1000);
        } catch (error) {
            reject(error);
        }
    });
};
