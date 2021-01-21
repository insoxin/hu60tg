const fs = require('fs/promises')
const dayjs = require('dayjs')
const cheerio = require('cheerio')
const _ = require('lodash')
const moment = require('moment')
const { Telegraf } = require('telegraf')
const axios = require('axios')

const TOKEN = process.env.TOKEN
const CHANNEL_ID = process.env.CHANNEL_ID
const TRENDING_URL = 'https://hu60.cn/q.php/index.index.json'
const TRENDING_DETAIL_URL = 'https://hu60.cn/q.php/bbs.search.html?keywords='

const bot = new Telegraf(TOKEN)

async function saveRawJson (data) {
  const date = dayjs().format('YYYY-MM-DD')
  const fullPath = `./api/${date}.json`
  const words = data.map(o => ({
    title: o.title,
    category: o.forum_name,
    description: o.description,
    url: o.topic_id,
    ctime: o.ctime,
    essence: o.essence,
    uinfo: o.uinfo.name,
    hot: o.read_count,
    reply_count: o.reply_count,
    ads: !!o.promotion
  }))
  let wordsAlreadyDownload = []
  try {
    await fs.stat(fullPath)
    const content = await fs.readFile(fullPath)
    wordsAlreadyDownload = JSON.parse(content)
  } catch (err) {
     //file not exsit
  }
  const allHots = _.uniqBy(_.concat(words, wordsAlreadyDownload), 'title')
  await fs.writeFile(fullPath, JSON.stringify(allHots))
}

 async function sendTgMessage(data) {
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']
  const text = data.splice(1,20).map((o, i) => {
    if (o.essence === 1) {
      return `🔥${ranks[i]}:<a href="https://hu60.cn/q.php/bbs.topic.${o.id}.html">${o.title}</a> @${o.uinfo.name},(${(o.read_count / 1000).toFixed(3)}k)`
	  
	  {(`$moment("20111031", "YYYYMMDD").fromNow()`)}
	  
    }
/*     if (ranks[i]) {
      return `:<a href="https://hu60.cn/q.php/bbs.topic.${o.id}.html">${o.title}</a> @${o.uinfo.name},(${o.read_count})`,`${moment().startOf('o.ctime').fromNow()}`
    } */
     return `${ranks[i]}:<a href="https://hu60.cn/q.php/bbs.topic.${o.id}.html">${o.title}</a> @${o.uinfo.name},(${o.read_count})`
	 
	 {`'${moment().startOf('o.ctime').fromNow()}'`}
	 
  }
  )
  text.unshift(`虎绿林首页存档${dayjs().format('YYYY-MM-DD HH:MM:ss')}`)
  await bot.telegram.sendMessage(CHANNEL_ID, text.join('\n'), {
    parse_mode: 'HTML',
    disable_web_page_preview: true
  })
}

/* async function fetchTrendingDetail (title) {
  const { data } = await axios.get(`${TRENDING_DETAIL_URL}${title}`)
  const $ = cheerio.load(data)
  return {
    category: $('#pl_topicband dl>dd').first().text(),
    desc: $('#pl_topicband dl>dd').last().text()
  }
} */


 async function bootstrap () {
  const { data } = await axios.get(TRENDING_URL)
  if (data.currPage === 1) {
    const items = data.newTopicList
    if (items) {
      for (let item of items) {
        //const { category, desc } = await fetchTrendingDetail(encodeURIComponent(item.desc))
       // item.category = category
       // item.description = desc
      }
      await saveRawJson(items)
      await sendTgMessage(items)
    }
  }
  process.exit(0)
}

bootstrap() 
 

