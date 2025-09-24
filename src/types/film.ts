
export type FilmItem = {
    id?: bigint;
    filmSourceID?: number;
    imdbID?: string;
    nameHK: string;
    nameEN?: string;
    nameSimplified?: string;
    posterUrlExternal?: string;
    posterUrlInternal?: string;
    onScreenDate?: string;
    duration?: string;
    language?: string;
    directorEN?: string;
    directorHK?: string;
    directorSimplified?: string;
    castHK?: string;
    castEN?: string;
    castSimplified?: string;
    genres?: string;
    ratingDouban?: number;
    ratingImdb?: number;
    country?: string;
    status?: number;
    source?: number;
};


export type ScheduleByCinema = {
  cinemaName:string;
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
  data: any;
  source: number;
  success:number;
  failed:number;
  uploadSuccess?: number;
  uploadFailed?:number;
}