import prisma from '../src/utils/prisma';

// Sprint 67 D4 — March 2026 mock data for hung40 dev so back-navigation
// in the Recap archive doesn't bottom out at empty months.
//
// Coverage:
//   • 8 moments W9-W12 (Mon 2026-03-02 → Sun 2026-03-29)
//   • Mix locations: 4 SG · 2 ĐL · 1 Phan Rang · 1 Đà Nẵng (1 NEW location vs April's set)
//   • 1 'lần đầu' tag (Đà Nẵng)
//   • 4-5 photos per moment (~36 total)
//   • 2 LoveLetters delivered in March
//   • 3 DailyQuestionResponses across the same 3 questions as April (so
//     March + April share Q ids → multi-month aggregate possible)

const HUNG40 = '3380fc89-1d35-4008-a6ea-fb7dd30c6f75';
const PARTNER = '880e0d6f-3dd8-466b-a26a-c89693f11383';
const COUPLE = '44ea6a84-bcde-49b4-9d81-a2e96eb7432d';

if (!process.env.DATABASE_URL?.includes('_dev')) {
  console.error('Refusing to seed against non-dev database.');
  process.exit(1);
}

type Loc = { name: string; lat: number; lng: number };
const LOCS: Record<string, Loc> = {
  sg: { name: 'Sài Gòn', lat: 10.7769, lng: 106.7009 },
  dl: { name: 'Đà Lạt', lat: 11.94, lng: 108.43 },
  pr: { name: 'Phan Rang', lat: 11.5667, lng: 108.9833 },
  dn: { name: 'Đà Nẵng', lat: 16.054, lng: 108.2022 },
};

const MOMENTS = [
  {
    title: 'Bún bò Huế đầu tháng 3',
    caption: 'Quán nhỏ chợ Bến Thành, đông khách giờ trưa. Em ăn cay được hẳn 1.5 ớt — anh ngồi cười cả buổi.',
    date: new Date(Date.UTC(2026, 2, 2, 5, 30, 0)),
    loc: LOCS.sg,
    tags: ['ăn uống'],
    photoSeeds: ['mar-bunbo-1', 'mar-bunbo-2', 'mar-bunbo-3', 'mar-bunbo-4'],
  },
  {
    title: 'Cà phê Phan Rang sáng cuối tuần',
    caption: 'Đường về quê ngoại, ghé Phan Rang ăn sáng. Cà phê bạc xỉu mặn ngọt vừa, em nhớ vị này lâu.',
    date: new Date(Date.UTC(2026, 2, 7, 1, 0, 0)),
    loc: LOCS.pr,
    tags: ['ăn uống'],
    photoSeeds: ['mar-pr-coffee-1', 'mar-pr-coffee-2', 'mar-pr-street', 'mar-pr-window', 'mar-pr-beach'],
  },
  {
    title: 'Đà Lạt cuối tuần đầu tháng',
    caption: 'Lên Đà Lạt 2 ngày 1 đêm. Trời lạnh vừa, em mặc áo len vàng. Mình đi Linh Phước, ăn nem nướng + uống vang Đà Lạt buổi tối.',
    date: new Date(Date.UTC(2026, 2, 8, 9, 0, 0)),
    loc: LOCS.dl,
    tags: ['du lịch'],
    photoSeeds: ['mar-dl-mar-1', 'mar-dl-linhphuoc', 'mar-dl-nemnuong', 'mar-dl-wine', 'mar-dl-evening'],
  },
  {
    title: 'Lần đầu Đà Nẵng — biển Mỹ Khê',
    caption: 'Bay ra Đà Nẵng cuối tuần. Mỹ Khê sóng êm, em tắm biển đầu tiên trong đời — anh ngồi cát đọc sách. Tối ăn mì Quảng. Lần đầu cùng nhau ra miền Trung.',
    date: new Date(Date.UTC(2026, 2, 14, 6, 0, 0)),
    loc: LOCS.dn,
    tags: ['lần đầu', 'du lịch'],
    photoSeeds: ['mar-dn-beach-1', 'mar-dn-beach-2', 'mar-dn-myque', 'mar-dn-evening', 'mar-dn-couple'],
  },
  {
    title: 'Sáng café Sài Gòn — đường sách',
    caption: 'Đường sách Nguyễn Văn Bình sáng chủ nhật. Em mua được 2 cuốn ưng ý: "Người trong bao" + sách thiền. Cà phê trứng đắng vừa.',
    date: new Date(Date.UTC(2026, 2, 16, 2, 30, 0)),
    loc: LOCS.sg,
    tags: ['ăn uống'],
    photoSeeds: ['mar-bookstreet-1', 'mar-bookstreet-2', 'mar-bookstreet-egg-coffee', 'mar-bookstreet-books'],
  },
  {
    title: 'Đà Lạt — chuyến vội',
    caption: 'Cuối tuần em rảnh, mình bay lên Đà Lạt 1 đêm. Hồ Xuân Hương buổi tối, gió lạnh, hai đứa đi bộ vòng hồ rồi về.',
    date: new Date(Date.UTC(2026, 2, 22, 11, 0, 0)),
    loc: LOCS.dl,
    tags: ['du lịch'],
    photoSeeds: ['mar-dl-2-xuanhuong', 'mar-dl-2-walk', 'mar-dl-2-coffee', 'mar-dl-2-evening', 'mar-dl-2-couple'],
  },
  {
    title: 'Tối nhà — pizza + phim',
    caption: 'Pizza Domino + Howl phim đêm. Em ngủ trước credit như mọi lần. Anh nhìn em ngủ rồi cũng tắt phim đi ngủ.',
    date: new Date(Date.UTC(2026, 2, 25, 14, 0, 0)),
    loc: LOCS.sg,
    tags: [],
    photoSeeds: ['mar-home-pizza-1', 'mar-home-pizza-2', 'mar-home-howl', 'mar-home-sleep'],
    authorId: PARTNER,
  },
  {
    title: 'Cuối tháng — chợ hoa Hồ Thị Kỷ',
    caption: 'Tự nhiên muốn mua hoa nguyên ngày. Mình đi chợ hoa Hồ Thị Kỷ, mua hồng cam + cẩm chướng + 2 chậu nhỏ. Phòng khách thay đổi.',
    date: new Date(Date.UTC(2026, 2, 28, 1, 30, 0)),
    loc: LOCS.sg,
    tags: ['ăn uống'],
    photoSeeds: ['mar-flower-1', 'mar-flower-2', 'mar-flower-3', 'mar-flower-home', 'mar-flower-arrange'],
  },
];

const LETTERS = [
  {
    senderId: PARTNER,
    recipientId: HUNG40,
    title: 'Tháng 3 đẹp ghê',
    content: 'Anh à, tháng 3 mình đi nhiều quá. Em không nhớ rõ mình đi đâu hôm nào, chỉ nhớ mỗi lúc anh quay sang nhìn em rồi cười là em thấy bình yên. Cảm ơn anh vì luôn rủ em đi đâu đó. Yêu anh rất nhiều.',
    mood: '❤️',
    deliveredAt: new Date(Date.UTC(2026, 2, 12, 10, 0, 0)),
  },
  {
    senderId: HUNG40,
    recipientId: PARTNER,
    title: 'Em là buổi chiều anh đợi suốt sáng',
    content: 'Có những buổi chiều Sài Gòn nóng, anh ngồi ở văn phòng nhìn đồng hồ chờ giờ về để gặp em. Hôm em đi Đà Nẵng tắm biển, anh không nghĩ mình sẽ vui đến vậy chỉ vì nhìn em cười. Em không cần làm gì cả, chỉ cần em ở đó. Tháng 3 này đẹp nhất là vì có em.',
    mood: '☕',
    deliveredAt: new Date(Date.UTC(2026, 2, 20, 13, 0, 0)),
  },
];

const Q_RESPONSES = [
  { questionId: 'seed-q-smile', userId: HUNG40, answer: 'Em cười khi đứng bên anh ở Mỹ Khê.', createdAt: new Date(Date.UTC(2026, 2, 14, 12, 0, 0)) },
  { questionId: 'seed-q-grateful', userId: PARTNER, answer: 'Em biết ơn anh vì rủ em đi Đà Nẵng — em sợ máy bay nhưng anh nắm tay em.', createdAt: new Date(Date.UTC(2026, 2, 14, 13, 0, 0)) },
  { questionId: 'seed-q-future', userId: HUNG40, answer: 'Anh muốn mình ở Đà Lạt 1 tuần làm việc remote.', createdAt: new Date(Date.UTC(2026, 2, 22, 5, 0, 0)) },
];

(async () => {
  const u = await prisma.user.findUnique({ where: { id: HUNG40 }, select: { coupleId: true, name: true } });
  if (!u || u.coupleId !== COUPLE) { console.error('user mismatch'); process.exit(1); }
  console.log(`Seeding March for ${u.name} couple=${COUPLE}`);

  const start = new Date(Date.UTC(2026, 2, 1));
  const end = new Date(Date.UTC(2026, 2, 31, 23, 59, 59));

  const purgedM = await prisma.moment.deleteMany({ where: { coupleId: COUPLE, date: { gte: start, lte: end }, title: { in: MOMENTS.map(m => m.title) } } });
  console.log(`Purged ${purgedM.count} prior March moments`);
  for (const m of MOMENTS) {
    await prisma.moment.create({
      data: {
        coupleId: COUPLE, authorId: m.authorId ?? HUNG40,
        title: m.title, caption: m.caption, date: m.date,
        latitude: m.loc.lat, longitude: m.loc.lng, location: m.loc.name,
        tags: m.tags,
        photos: { create: m.photoSeeds.map((s, i) => ({ filename: `seed-mar-${s}-${i}.jpg`, url: `https://picsum.photos/seed/${s}/800/800` })) },
      },
    });
  }
  console.log(`+ ${MOMENTS.length} moments`);

  const purgedL = await prisma.loveLetter.deleteMany({ where: { coupleId: COUPLE, deliveredAt: { gte: start, lte: end }, title: { in: LETTERS.map(l => l.title) } } });
  console.log(`Purged ${purgedL.count} prior March letters`);
  for (const l of LETTERS) {
    await prisma.loveLetter.create({
      data: { coupleId: COUPLE, senderId: l.senderId, recipientId: l.recipientId, title: l.title, content: l.content, mood: l.mood, status: 'DELIVERED', scheduledAt: l.deliveredAt, deliveredAt: l.deliveredAt },
    });
  }
  console.log(`+ ${LETTERS.length} letters`);

  for (const r of Q_RESPONSES) {
    await prisma.dailyQuestionResponse.upsert({
      where: { questionId_coupleId_userId: { questionId: r.questionId, coupleId: COUPLE, userId: r.userId } },
      update: { answer: r.answer, createdAt: r.createdAt },
      create: { questionId: r.questionId, coupleId: COUPLE, userId: r.userId, answer: r.answer, createdAt: r.createdAt },
    });
  }
  console.log(`+ ${Q_RESPONSES.length} Q responses`);

  console.log('March seed done.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
