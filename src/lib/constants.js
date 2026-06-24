export const PRODUCERS = [
  { no: '01', name: '木村茂',     yago: 'ヤマ七'    },
  { no: '02', name: '木村豊',     yago: 'マルキ'    },
  { no: '03', name: '木村友一',   yago: 'マル長'    },
  { no: '04', name: '阿部功',     yago: 'カネ木'    },
  { no: '05', name: '阿部亀一郎', yago: 'イリヤマ三' },
  { no: '06', name: '阿部優一郎', yago: '向山'      },
  { no: '07', name: '阿部剛',     yago: '稲荷丸'    },
  { no: '08', name: '遠藤貴大',   yago: '寿丸'      },
];

export const MARKETS = [
  { no: '1', name: '石巻魚市場',   canJoto: true,  canSotai: true,  sotaiDefault: false },
  { no: '2', name: '女川魚市場',   canJoto: true,  canSotai: true,  sotaiDefault: false },
  { no: '3', name: '志津川魚市場', canJoto: false, canSotai: true,  sotaiDefault: true  },
];

export const MARKET_COLORS = {
  '1': { bg: '#1565c0', text: '#ffffff', dot: '#1565c0', label: '石巻' },
  '2': { bg: '#2e7d32', text: '#ffffff', dot: '#2e7d32', label: '女川' },
  '3': { bg: '#c62828', text: '#ffffff', dot: '#c62828', label: '志津川' },
};

export const STATUS = {
  PLANNED:  '予定',
  CANCEL:   'キャンセル',
  CHANGED:  '日程変更',
  DELETED:  '削除',
};

export const TRADE = {
  JOTO:  '上場',
  SOTAI: '相対',
};

export const DOW_JP = ['日', '月', '火', '水', '木', '金', '土'];