const logoFiles: Record<string, string> = {
  '玻利瓦尔': 'bolivar.jpg',
  '波利瓦尔': 'bolivar.jpg',
  '高希霸': 'cohiba.png',
  '库阿巴': 'cuaba.jpg',
  '古巴荣耀': 'la-gloria-cubana.jpg',
  '外交官': 'diplomaticos.jpg',
  '世界之王': 'el-rey-del-mundo.jpg',
  '丰塞卡': 'fonseca.jpg',
  '乌普曼': 'h-upmann.jpg',
  '罗密欧与朱丽叶': 'romeo-y-julieta.jpg',
  '罗密欧朱丽叶': 'romeo-y-julieta.jpg',
  '罗密欧': 'romeo-y-julieta.jpg',
  '特立尼达': 'trinidad.jpg',
  '好友': 'hoyo-de-monterrey.png',
  '好友蒙特利': 'hoyo-de-monterrey.png',
  '何塞皮埃德拉': 'jose-l-piedra.jpg',
  '比亚达': 'jose-l-piedra.jpg',
  '胡安洛佩兹': 'juan-lopez.jpg',
  '胡安洛佩斯': 'juan-lopez.jpg',
  '卡诺之花': 'la-flor-de-cano.jpg',
  '蒙特克里斯托': 'montecristo.jpg',
  '蒙特': 'montecristo.jpg',
  '帕特加斯': 'partagas.jpg',
  '波尔拉腊尼亚加': 'por-larranaga.jpg',
  '波尔拉腊尼亚格': 'por-larranaga.jpg',
  '潘趣': 'punch.jpg',
  '奥赛码头': 'quai-d-orsay.jpg',
  '金特罗': 'quintero.jpg',
  '拉斐尔冈萨雷斯': 'rafael-gonzalez.jpg',
  '雷蒙阿龙': 'ramon-allones.jpg',
  '雷蒙阿隆尼': 'ramon-allones.jpg',
  '圣路易斯雷': 'saint-luis-rey.jpg',
  '圣克里斯托瓦尔': 'san-cristobal-de-la-habana.jpg',
  '圣克里斯托瓦尔哈瓦那': 'san-cristobal-de-la-habana.jpg',
  '桑丘潘沙': 'sancho-panza.jpg',
  '维加斯罗宾纳': 'vegas-robaina.jpg',
  '罗宾纳': 'vegas-robaina.jpg',
  '维格罗斯': 'vegueros.jpg',
  '农夫': 'vegueros.jpg',
  bolivar: 'bolivar.jpg',
  cohiba: 'cohiba.png',
  cuaba: 'cuaba.jpg',
  diplomaticos: 'diplomaticos.jpg',
  'el rey del mundo': 'el-rey-del-mundo.jpg',
  fonseca: 'fonseca.jpg',
  'h upmann': 'h-upmann.jpg',
  'hoyo de monterrey': 'hoyo-de-monterrey.png',
  'jose l piedra': 'jose-l-piedra.jpg',
  'juan lopez': 'juan-lopez.jpg',
  'la flor de cano': 'la-flor-de-cano.jpg',
  'la gloria cubana': 'la-gloria-cubana.jpg',
  montecristo: 'montecristo.jpg',
  partagas: 'partagas.jpg',
  'por larranaga': 'por-larranaga.jpg',
  punch: 'punch.jpg',
  "quai d'orsay": 'quai-d-orsay.jpg',
  quintero: 'quintero.jpg',
  'rafael gonzalez': 'rafael-gonzalez.jpg',
  'ramon allones': 'ramon-allones.jpg',
  'romeo y julieta': 'romeo-y-julieta.jpg',
  'saint luis rey': 'saint-luis-rey.jpg',
  'san cristobal de la habana': 'san-cristobal-de-la-habana.jpg',
  'sancho panza': 'sancho-panza.jpg',
  trinidad: 'trinidad.jpg',
  'vegas robaina': 'vegas-robaina.jpg',
  vegueros: 'vegueros.jpg'
}

function normalizeBrand(brand: string): string {
  return brand
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' y ')
    .replace(/[^\p{L}\p{N}']+/gu, ' ')
    .trim()
}

export function brandSearchText(brand: HabanosBrand): string {
  return [brand.name, brand.english, ...brand.aliases].map(normalizeBrand).join(' ')
}

export function standardBrandName(value: string): string | undefined {
  const query = normalizeBrand(value)
  return habanosBrands.find((brand) =>
    [brand.name, brand.english, ...brand.aliases].some((name) => normalizeBrand(name) === query)
  )?.name
}

export function brandLogoUrl(brand: string): string | undefined {
  const file = logoFiles[normalizeBrand(brand)]
  return file ? `${import.meta.env.BASE_URL}brand-logos/habanos/${file}` : undefined
}
export interface HabanosBrand {
  name: string
  english: string
  aliases: string[]
  file: string
}

export const habanosBrands: HabanosBrand[] = [
  { name: '高希霸', english: 'Cohiba', aliases: [], file: 'cohiba.png' },
  { name: '蒙特克里斯托', english: 'Montecristo', aliases: ['蒙特'], file: 'montecristo.jpg' },
  { name: '罗密欧与朱丽叶', english: 'Romeo y Julieta', aliases: ['罗密欧朱丽叶', '罗密欧'], file: 'romeo-y-julieta.jpg' },
  { name: '帕特加斯', english: 'Partagás', aliases: [], file: 'partagas.jpg' },
  { name: '好友蒙特利', english: 'Hoyo de Monterrey', aliases: ['好友'], file: 'hoyo-de-monterrey.png' },
  { name: '乌普曼', english: 'H. Upmann', aliases: [], file: 'h-upmann.jpg' },
  { name: '何塞·皮埃德拉', english: 'José L. Piedra', aliases: ['何塞皮埃德拉', '比亚达'], file: 'jose-l-piedra.jpg' },
  { name: '库阿巴', english: 'Cuaba', aliases: [], file: 'cuaba.jpg' },
  { name: '圣克里斯托瓦尔', english: 'San Cristóbal de La Habana', aliases: ['圣克里斯托瓦尔哈瓦那'], file: 'san-cristobal-de-la-habana.jpg' },
  { name: '特立尼达', english: 'Trinidad', aliases: [], file: 'trinidad.jpg' },
  { name: '玻利瓦尔', english: 'Bolívar', aliases: ['波利瓦尔'], file: 'bolivar.jpg' },
  { name: '丰塞卡', english: 'Fonseca', aliases: [], file: 'fonseca.jpg' },
  { name: '潘趣', english: 'Punch', aliases: [], file: 'punch.jpg' },
  { name: '金特罗', english: 'Quintero', aliases: [], file: 'quintero.jpg' },
  { name: '维加斯罗宾纳', english: 'Vegas Robaina', aliases: ['罗宾纳'], file: 'vegas-robaina.jpg' },
  { name: '外交官', english: 'Diplomáticos', aliases: [], file: 'diplomaticos.jpg' },
  { name: '世界之王', english: 'El Rey del Mundo', aliases: [], file: 'el-rey-del-mundo.jpg' },
  { name: '胡安·洛佩兹', english: 'Juan López', aliases: ['胡安洛佩兹', '胡安洛佩斯'], file: 'juan-lopez.jpg' },
  { name: '卡诺之花', english: 'La Flor de Cano', aliases: [], file: 'la-flor-de-cano.jpg' },
  { name: '古巴荣耀', english: 'La Gloria Cubana', aliases: [], file: 'la-gloria-cubana.jpg' },
  { name: '波尔·拉腊尼亚加', english: 'Por Larrañaga', aliases: ['波尔拉腊尼亚加', '波尔拉腊尼亚格'], file: 'por-larranaga.jpg' },
  { name: '奥赛码头', english: "Quai d'Orsay", aliases: [], file: 'quai-d-orsay.jpg' },
  { name: '拉斐尔·冈萨雷斯', english: 'Rafael González', aliases: ['拉斐尔冈萨雷斯'], file: 'rafael-gonzalez.jpg' },
  { name: '雷蒙·阿龙', english: 'Ramón Allones', aliases: ['雷蒙阿龙', '雷蒙阿隆尼'], file: 'ramon-allones.jpg' },
  { name: '圣路易斯·雷', english: 'Saint Luis Rey', aliases: ['圣路易斯雷'], file: 'saint-luis-rey.jpg' },
  { name: '桑丘·潘沙', english: 'Sancho Panza', aliases: ['桑丘潘沙'], file: 'sancho-panza.jpg' },
  { name: '维格罗斯', english: 'Vegueros', aliases: ['农夫'], file: 'vegueros.jpg' }
]
