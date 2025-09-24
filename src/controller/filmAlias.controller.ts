import filmAliasService from "../services/filmAlias.service";

export const getFilmAlias = async (rawName: string, source: number) => {
    if (!rawName || !source) {
        console.log("getFilmAlias Failed: 缺少必要参数 rawName,source");
        return;
    }
    const result = await filmAliasService.getFilmAlias({
        raw_name: rawName,
        source: Number(source),
    });
    return result;
};
