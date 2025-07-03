export type FilmItem = {
    id?: number;
    film_source_id?: number;
    imdb_id?: string;
    name_hk: string;
    name_en?: string;
    name_simplified?: string;
    poster_url_external?: string;
    poster_url_internal?: string;
    on_screen_date?: string;
    duration?: string;
    language?: string;
    director_en?: string;
    director_hk?: string;
    director_simplified?: string;
    cast_hk?: string;
    cast_en?: string;
    cast_simplified?: string;
    genres?: string;
    rating_douban?: number;
    rating_imdb?: number;
    country?: string;
    status?: number;
    source?: number;
};


export type ScheduleByCinema = {
  cinema_name:string;
  schedules:{time?:string;date?:string;house?:string;attr?:string}[]
}

export type FilmItemWithSchedule = {
  scheduleByCinemaArr?: ScheduleByCinema[]
} & FilmItem

export enum FilmQueryType {
  FILM = 1,
  CINEMA = 2,
  DATE_RANGE = 3
}

export interface SaveAndUploadFilmRes {
  source: number;
  total: number;
  success:number;
  failed:number;
  uploadSuccess?: number;
  uploadFailed?:number;
}