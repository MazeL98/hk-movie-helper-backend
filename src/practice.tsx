import axios from 'axios';
import decryptDoubanData, { extractDataFromPage } from 'douban-search-crack';



const doCode = async () =>{
const { data: doubanSearchPage } = await axios.get('https://search.douban.com/movie/subject_search', {
  params: {
    search_text: 'tt14812784',
    cat: 1002
  },
  responseType: 'text'
})
console.log("doubanSearchPage",doubanSearchPage)
// const encryptDoubanData = extractDataFromPage(doubanSearchPage)
// console.log(decryptDoubanData(encryptDoubanData))
}

doCode()

