export enum FILM_SOURCE {
  BROADWAY = 1,
  HKIFF = 2,
  CINEFAN =3,
  EEG=4
}

// 爬虫源地址
export const filmSources =  {
  [FILM_SOURCE.BROADWAY]: {
    name: '百老匯',
    endPoints: [
      {
        url: 'https://www.cinema.com.hk/tc/movie/ticketing/bymovie',
        handler: 'scrapeData'
      }
    ]
  },
  [FILM_SOURCE.HKIFF]: {
    name: '香港国际电影节',
    endPoints: [
      {
        url: 'https://www.hkiff.org.hk/film/list',
        handler: 'scrapeData'
      },
    ],
    
  },
  [FILM_SOURCE.CINEFAN]: {
    name: 'CineFan',
    endPoints: [
      {
        url: 'https://www.cinefan.com.hk',
        handler: 'scrapeData'
      },
    ],
  },
  [FILM_SOURCE.EEG]: {
    name: 'EEG',
    endPoints: [
      {
        url: 'https://www.emperorcinemas.com/zh/ticketing/by_movie?',
        handler: 'scrapeData'
      },
    ],
  },
}

