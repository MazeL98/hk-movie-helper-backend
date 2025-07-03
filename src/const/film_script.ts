// 爬虫任务脚本
import {FILM_SOURCE} from "./film_source";
export const filmCrawlerScripts =  [
  {
      source: FILM_SOURCE.BROADWAY,
      path: "../crawlers/cinema/broadway.crawler.ts",
  },
  {
    source:FILM_SOURCE.EEG,
    path:"../crawlers/cinema/eeg.crawler.ts"
  },
  // {
  //   source: FILM_SOURCE.HKIFF,
  //     path: "../crawlers/cinema/hkiff.crawler.ts",
  // }
];