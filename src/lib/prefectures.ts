export type Prefecture = {
  ja: string;
  en: string;
  // 近くの建物・駅を入力しなかったときに使う、その都道府県の主な駅
  // 基本は県庁所在地の中心駅。ほかに利用者の多いターミナル駅があればそちらにする
  station: { ja: string; en: string };
};

// 都道府県の一覧（北から順）。検索には日本語の名前を使い、画面には表示言語に合わせた名前を出す
export const PREFECTURES: Prefecture[] = [
  { ja: "北海道", en: "Hokkaido", station: { ja: "札幌駅", en: "Sapporo Station" } },
  { ja: "青森県", en: "Aomori", station: { ja: "青森駅", en: "Aomori Station" } },
  { ja: "岩手県", en: "Iwate", station: { ja: "盛岡駅", en: "Morioka Station" } },
  { ja: "宮城県", en: "Miyagi", station: { ja: "仙台駅", en: "Sendai Station" } },
  { ja: "秋田県", en: "Akita", station: { ja: "秋田駅", en: "Akita Station" } },
  { ja: "山形県", en: "Yamagata", station: { ja: "山形駅", en: "Yamagata Station" } },
  { ja: "福島県", en: "Fukushima", station: { ja: "郡山駅", en: "Koriyama Station" } },
  { ja: "茨城県", en: "Ibaraki", station: { ja: "水戸駅", en: "Mito Station" } },
  { ja: "栃木県", en: "Tochigi", station: { ja: "宇都宮駅", en: "Utsunomiya Station" } },
  { ja: "群馬県", en: "Gunma", station: { ja: "高崎駅", en: "Takasaki Station" } },
  { ja: "埼玉県", en: "Saitama", station: { ja: "大宮駅", en: "Omiya Station" } },
  { ja: "千葉県", en: "Chiba", station: { ja: "千葉駅", en: "Chiba Station" } },
  { ja: "東京都", en: "Tokyo", station: { ja: "東京駅", en: "Tokyo Station" } },
  { ja: "神奈川県", en: "Kanagawa", station: { ja: "横浜駅", en: "Yokohama Station" } },
  { ja: "新潟県", en: "Niigata", station: { ja: "新潟駅", en: "Niigata Station" } },
  { ja: "富山県", en: "Toyama", station: { ja: "富山駅", en: "Toyama Station" } },
  { ja: "石川県", en: "Ishikawa", station: { ja: "金沢駅", en: "Kanazawa Station" } },
  { ja: "福井県", en: "Fukui", station: { ja: "福井駅", en: "Fukui Station" } },
  { ja: "山梨県", en: "Yamanashi", station: { ja: "甲府駅", en: "Kofu Station" } },
  { ja: "長野県", en: "Nagano", station: { ja: "長野駅", en: "Nagano Station" } },
  { ja: "岐阜県", en: "Gifu", station: { ja: "岐阜駅", en: "Gifu Station" } },
  { ja: "静岡県", en: "Shizuoka", station: { ja: "静岡駅", en: "Shizuoka Station" } },
  { ja: "愛知県", en: "Aichi", station: { ja: "名古屋駅", en: "Nagoya Station" } },
  { ja: "三重県", en: "Mie", station: { ja: "四日市駅", en: "Yokkaichi Station" } },
  { ja: "滋賀県", en: "Shiga", station: { ja: "草津駅", en: "Kusatsu Station" } },
  { ja: "京都府", en: "Kyoto", station: { ja: "京都駅", en: "Kyoto Station" } },
  { ja: "大阪府", en: "Osaka", station: { ja: "大阪駅", en: "Osaka Station" } },
  { ja: "兵庫県", en: "Hyogo", station: { ja: "三ノ宮駅", en: "Sannomiya Station" } },
  { ja: "奈良県", en: "Nara", station: { ja: "近鉄奈良駅", en: "Kintetsu-Nara Station" } },
  { ja: "和歌山県", en: "Wakayama", station: { ja: "和歌山駅", en: "Wakayama Station" } },
  { ja: "鳥取県", en: "Tottori", station: { ja: "鳥取駅", en: "Tottori Station" } },
  { ja: "島根県", en: "Shimane", station: { ja: "松江駅", en: "Matsue Station" } },
  { ja: "岡山県", en: "Okayama", station: { ja: "岡山駅", en: "Okayama Station" } },
  { ja: "広島県", en: "Hiroshima", station: { ja: "広島駅", en: "Hiroshima Station" } },
  { ja: "山口県", en: "Yamaguchi", station: { ja: "新山口駅", en: "Shin-Yamaguchi Station" } },
  { ja: "徳島県", en: "Tokushima", station: { ja: "徳島駅", en: "Tokushima Station" } },
  { ja: "香川県", en: "Kagawa", station: { ja: "高松駅", en: "Takamatsu Station" } },
  { ja: "愛媛県", en: "Ehime", station: { ja: "松山駅", en: "Matsuyama Station" } },
  { ja: "高知県", en: "Kochi", station: { ja: "高知駅", en: "Kochi Station" } },
  { ja: "福岡県", en: "Fukuoka", station: { ja: "博多駅", en: "Hakata Station" } },
  { ja: "佐賀県", en: "Saga", station: { ja: "佐賀駅", en: "Saga Station" } },
  { ja: "長崎県", en: "Nagasaki", station: { ja: "長崎駅", en: "Nagasaki Station" } },
  { ja: "熊本県", en: "Kumamoto", station: { ja: "熊本駅", en: "Kumamoto Station" } },
  { ja: "大分県", en: "Oita", station: { ja: "大分駅", en: "Oita Station" } },
  { ja: "宮崎県", en: "Miyazaki", station: { ja: "宮崎駅", en: "Miyazaki Station" } },
  { ja: "鹿児島県", en: "Kagoshima", station: { ja: "鹿児島中央駅", en: "Kagoshima-Chuo Station" } },
  { ja: "沖縄県", en: "Okinawa", station: { ja: "県庁前駅", en: "Kenchomae Station" } },
];

export function findPrefecture(ja: string): Prefecture | undefined {
  return PREFECTURES.find((p) => p.ja === ja);
}
