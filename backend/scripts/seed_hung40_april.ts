import prisma from '../src/utils/prisma';

// Sprint 67 hot-fix D1 — full April seed for hung40 + partner.
//
// Coverage:
//   • W14 (1-5/4)  → 4 moments
//   • W15 (6-12/4) → 5 moments
//   • W16 (13-19/4)→ 6 moments  (idempotently re-creates the W16 set)
//   • W17 (20-26/4)→ 5 moments  (extends the existing W17 set)
//   = 20 moments total · 4-6 photos each (~95 photos · 7 distinct
//     locations · 4 'lần đầu' tags · variety: ăn uống / du lịch / lễ hội)
//
// Plus:
//   • 4 LoveLetters delivered in April (alternating sender)
//   • 6 DailyQuestionResponses across 3 questions (one wins topQuestion)
//   • 2 DatePlans inside April (drives `trips` / datePlans.count)
//
// Idempotent: deletes by exact title pattern + date window before
// re-creating. _dev DB guard at top.

const HUNG40_USER_ID = '3380fc89-1d35-4008-a6ea-fb7dd30c6f75';
const PARTNER_USER_ID = '880e0d6f-3dd8-466b-a26a-c89693f11383';
const COUPLE_ID = '44ea6a84-bcde-49b4-9d81-a2e96eb7432d';

if (!process.env.DATABASE_URL?.includes('_dev')) {
  console.error('Refusing to seed against non-dev database. DATABASE_URL must include `_dev`.');
  process.exit(1);
}

type Loc = { name: string; lat: number; lng: number };
const LOCS: Record<string, Loc> = {
  sg: { name: 'Sài Gòn', lat: 10.7769, lng: 106.7009 },
  dl: { name: 'Đà Lạt', lat: 11.94, lng: 108.43 },
  pr: { name: 'Phan Rang', lat: 11.5667, lng: 108.9833 },
  vt: { name: 'Vũng Tàu', lat: 10.346, lng: 107.0843 },
  dn: { name: 'Đà Nẵng', lat: 16.054, lng: 108.2022 },
  hn: { name: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
  sgp: { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
};

type SeedMoment = {
  title: string;
  caption: string;
  date: Date;
  loc: Loc;
  tags: string[];
  photoSeeds: string[];
  authorId?: string; // defaults to hung40
};

const MOMENTS: SeedMoment[] = [
  // ─── W14 (1-5/4) ──────────────────────────────────────────────────
  {
    title: 'Mở đầu tháng 4 — cà phê Pasteur',
    caption:
      'Sáng đầu tháng, hai đứa đi cà phê Pasteur cuối hẻm. Bàn gỗ cũ, ly cà phê đá đậm. Mình lập danh sách những thứ muốn làm tháng này — đa số là đi đâu đó cùng nhau.',
    date: new Date(Date.UTC(2026, 3, 1, 2, 0, 0)),
    loc: LOCS.sg,
    tags: ['ăn uống'],
    photoSeeds: ['apr-pasteur-1', 'apr-pasteur-2', 'apr-pasteur-3', 'apr-pasteur-list'],
  },
  {
    title: 'Lần đầu xem hoàng hôn ở Bãi Sau Vũng Tàu',
    caption:
      'Mình tự nhiên thèm biển. 2 tiếng từ Sài Gòn xuống Bãi Sau Vũng Tàu. Mây hồng rực, gió thoảng nhẹ, hai đứa ngồi cát đến tối mới về. Lần đầu mình ngồi cùng nhau ngắm hoàng hôn ở đây.',
    date: new Date(Date.UTC(2026, 3, 3, 9, 0, 0)),
    loc: LOCS.vt,
    tags: ['lần đầu', 'du lịch'],
    photoSeeds: ['apr-vt-sunset-1', 'apr-vt-sunset-2', 'apr-vt-sunset-3', 'apr-vt-sand', 'apr-vt-couple', 'apr-vt-shells'],
  },
  {
    title: 'Brunch Chủ Nhật ở District 2',
    caption:
      'Quán nhỏ ven sông Sài Gòn, eggs benedict + flat white. Chiều mưa nhẹ. Em đọc sách, anh ngồi nhìn người đi qua đi lại, cười.',
    date: new Date(Date.UTC(2026, 3, 5, 4, 0, 0)),
    loc: LOCS.sg,
    tags: ['ăn uống'],
    photoSeeds: ['apr-d2-brunch-1', 'apr-d2-brunch-2', 'apr-d2-river', 'apr-d2-rain', 'apr-d2-book'],
    authorId: PARTNER_USER_ID,
  },
  {
    title: 'Đi xem hòa nhạc Trịnh ở Nhà Hát',
    caption:
      'Đêm chủ nhật ở Nhà Hát Thành Phố. Trịnh Công Sơn, dàn nhạc giao hưởng. Em mặc áo dài, anh mặc sơ mi trắng. Ra về chân chẳng muốn rời thành phố.',
    date: new Date(Date.UTC(2026, 3, 5, 13, 0, 0)),
    loc: LOCS.sg,
    tags: ['lễ hội'],
    photoSeeds: ['apr-trinh-1', 'apr-trinh-2', 'apr-trinh-3', 'apr-trinh-aodai'],
  },

  // ─── W15 (6-12/4) ─────────────────────────────────────────────────
  {
    title: 'Lần đầu bay ra Hà Nội cùng nhau',
    caption:
      'Vé sale, hai đứa quyết đi nhanh 3 ngày. Hà Nội đầu tháng tư mưa phùn, lạnh ở mức vừa phải. Sân bay Nội Bài đón mình bằng gió. Lần đầu hai đứa cùng bay ra Bắc.',
    date: new Date(Date.UTC(2026, 3, 7, 1, 30, 0)),
    loc: LOCS.hn,
    tags: ['lần đầu', 'du lịch'],
    photoSeeds: ['apr-hn-airport', 'apr-hn-rain', 'apr-hn-noi-bai', 'apr-hn-bus', 'apr-hn-arrival'],
  },
  {
    title: 'Phở Hà Nội sáng sớm',
    caption:
      'Sáng dậy 6h đi phở Bát Đàn. Hàng dài, mình đứng chờ 25 phút, nước phở nóng hổi rưới gừng nướng. Em ăn hết tô, lần đầu thấy em nói "phở ngon nhất em từng ăn".',
    date: new Date(Date.UTC(2026, 3, 8, 0, 30, 0)),
    loc: LOCS.hn,
    tags: ['ăn uống'],
    photoSeeds: ['apr-hn-pho-1', 'apr-hn-pho-2', 'apr-hn-pho-line', 'apr-hn-pho-bowl'],
  },
  {
    title: 'Hồ Hoàn Kiếm chiều xanh',
    caption:
      'Đi bộ quanh hồ Hoàn Kiếm + cầu Thê Húc đỏ rực. Mua cốm gói lá sen, ngồi ghế đá nghe người đi đường nói chuyện. Hà Nội có nhịp khác Sài Gòn — chậm hơn, ấm hơn.',
    date: new Date(Date.UTC(2026, 3, 8, 9, 0, 0)),
    loc: LOCS.hn,
    tags: ['du lịch'],
    photoSeeds: ['apr-hn-hk-1', 'apr-hn-hk-2', 'apr-hn-hk-bridge', 'apr-hn-com', 'apr-hn-bench'],
    authorId: PARTNER_USER_ID,
  },
  {
    title: 'Về Sài Gòn — pizza ở nhà',
    caption:
      'Bay về tối thứ Bảy, hai đứa quá mệt nên đặt pizza + tắm + xem phim "About Time" lần thứ N. Em ngủ trước khi credit chạy.',
    date: new Date(Date.UTC(2026, 3, 11, 13, 0, 0)),
    loc: LOCS.sg,
    tags: [],
    photoSeeds: ['apr-home-pizza-1', 'apr-home-pizza-2', 'apr-home-movie', 'apr-home-sleep'],
  },
  {
    title: 'Chủ Nhật chợ hoa Hồ Thị Kỷ',
    caption:
      'Sáng chủ nhật mình dậy muộn rồi đi chợ hoa Hồ Thị Kỷ. Hoa cẩm chướng + hồng vintage + mấy chậu cây nhỏ. Đem về nhà, phòng khách thay đổi hẳn.',
    date: new Date(Date.UTC(2026, 3, 12, 1, 30, 0)),
    loc: LOCS.sg,
    tags: ['ăn uống'],
    photoSeeds: ['apr-flower-1', 'apr-flower-2', 'apr-flower-3', 'apr-flower-home', 'apr-flower-arrange'],
  },

  // ─── W16 (13-19/4) ────────────────────────────────────────────────
  {
    title: 'Sáng thứ Hai cà phê Bùi Viện',
    caption:
      'Mở mắt là đi cà phê. Hai đứa lười biếng kéo dài cả buổi sáng, trời Sài Gòn dịu ghê, em uống cappuccino còn anh latte. Một tuần mới, mà mình đã quyết: đi chậm thôi, đừng để tuần này trôi như tuần trước.',
    date: new Date(Date.UTC(2026, 3, 13, 2, 30, 0)),
    loc: LOCS.sg,
    tags: ['ăn uống'],
    photoSeeds: ['sg-coffee-monday', 'sg-coffee-cup', 'sg-cafe-window', 'sg-cafe-laugh'],
  },
  {
    title: 'Lần đầu lái xe lên Đà Lạt',
    caption:
      'Mình ba tiếng rưỡi từ Sài Gòn lên Đà Lạt. Anh lái nửa đầu, em lái nửa sau (mà em chỉ chạy được 60km/h thôi). Đèo Bảo Lộc mây kéo về tận đường, em sợ nhưng vẫn cười. Lần đầu mình đi xa cùng nhau bằng xe nhà.',
    date: new Date(Date.UTC(2026, 3, 14, 9, 0, 0)),
    loc: LOCS.dl,
    tags: ['lần đầu', 'du lịch'],
    photoSeeds: ['dl-drive-1', 'dl-drive-2', 'dl-mountain-view', 'dl-mist', 'dl-wheel', 'dl-car-stop'],
  },
  {
    title: 'Đà Lạt — bữa tối quanh hồ',
    caption:
      'Quán nhỏ nhìn ra hồ Tuyền Lâm. Lẩu gà lá é nóng hổi, em ăn được hai chén cơm. Trời lạnh đủ để hai đứa ngồi gần lại, anh kể về nơi này hồi anh học cấp 3 đến chơi với gia đình. Em chỉ ngồi nghe.',
    date: new Date(Date.UTC(2026, 3, 15, 12, 30, 0)),
    loc: LOCS.dl,
    tags: ['ăn uống'],
    photoSeeds: ['dl-lake-dinner', 'dl-hotpot', 'dl-lake-view', 'dl-table-warm', 'dl-night-light'],
  },
  {
    title: 'Đường về Phan Rang chiều ngược nắng',
    caption:
      'Tự nhiên đổi kế hoạch, từ Đà Lạt rẽ hướng Phan Rang. Đường QL27 đi qua đồi cát + đồng nho dài tít. Em ngồi cửa kính nhìn nắng vàng đậm dần, chụp được mấy tấm ưng. Lần đầu mình đến Phan Rang.',
    date: new Date(Date.UTC(2026, 3, 16, 8, 0, 0)),
    loc: LOCS.pr,
    tags: ['lần đầu', 'du lịch'],
    photoSeeds: ['pr-road-1', 'pr-vineyard', 'pr-sunset-road', 'pr-window-light', 'pr-dunes'],
  },
  {
    title: 'Bãi biển Vũng Tàu cuối tuần',
    caption:
      'Trên đường về, mình ghé Vũng Tàu cho em tắm biển. Sóng vừa, không quá đông. Em lượm vỏ ốc cả buổi, anh ngồi trên cát đọc sách + hứng cát em ném đùa. Đến tối quay về Sài Gòn, em ngủ luôn trên xe.',
    date: new Date(Date.UTC(2026, 3, 18, 4, 0, 0)),
    loc: LOCS.vt,
    tags: ['du lịch'],
    photoSeeds: ['vt-beach-1', 'vt-shells', 'vt-waves', 'vt-sunset-sand', 'vt-couple-walk', 'vt-evening'],
  },
  {
    title: 'Chủ Nhật ở nhà — tổng kết tuần',
    caption:
      'Cả tuần đi rộn lắm rồi, Chủ Nhật mình ở nhà ngủ nướng đến 11h. Trưa nấu mì gà, chiều xem hết một bộ phim ngắn. Em mở album hình tuần này, hai đứa lật từng tấm cười. Tuần này nhớ rất lâu.',
    date: new Date(Date.UTC(2026, 3, 19, 7, 30, 0)),
    loc: LOCS.sg,
    tags: [],
    photoSeeds: ['sg-home-rest-1', 'sg-noodle', 'sg-couch-movie', 'sg-album-flip'],
  },

  // ─── W17 (20-26/4) ────────────────────────────────────────────────
  {
    title: 'Lần đầu bay sang Singapore',
    caption:
      'Vé khuyến mãi, hai đứa book đi 3 đêm Singapore. Đáp Changi sáng sớm, ấn tượng đầu tiên — sân bay đẹp như resort, hồ cá khổng lồ giữa sân ga. Marina Bay tối lên đèn, em bảo "không thật".',
    date: new Date(Date.UTC(2026, 3, 20, 1, 0, 0)),
    loc: LOCS.sgp,
    tags: ['lần đầu', 'du lịch'],
    photoSeeds: ['sgp-changi', 'sgp-marina-1', 'sgp-marina-2', 'sgp-marina-night', 'sgp-fish'],
  },
  {
    title: 'Hawker chicken rice ở Maxwell',
    caption:
      'Theo gợi ý của Anthony Bourdain — Tian Tian Chicken Rice. Xếp hàng 30 phút. Cơm thơm gừng, gà luộc mềm. Em vừa ăn vừa nói "đáng đi xa". Anh chỉ cười.',
    date: new Date(Date.UTC(2026, 3, 21, 5, 30, 0)),
    loc: LOCS.sgp,
    tags: ['ăn uống'],
    photoSeeds: ['sgp-maxwell-1', 'sgp-maxwell-2', 'sgp-chicken-rice', 'sgp-line', 'sgp-stall'],
  },
  {
    title: 'Chiều Đà Lạt ngồi chờ mưa',
    caption:
      'Cà phê nóng, tiếng mưa rơi ngoài hiên, hai đứa ngồi nhìn nhau cười. Lần đầu đi xa nhau lâu thế này — Đà Lạt đẹp hơn mình tưởng, nhất là buổi chiều ngồi chờ mưa kéo qua.',
    date: new Date(Date.UTC(2026, 3, 22, 9, 0, 0)),
    loc: LOCS.dl,
    tags: ['lần đầu', 'du lịch'],
    photoSeeds: ['dalat-rain', 'dalat-cafe', 'dalat-window'],
  },
  {
    title: 'Cà phê đi bộ Nguyễn Huệ',
    caption:
      'Sáng cuối tuần Sài Gòn nắng nhẹ, hai đứa đi bộ dọc Nguyễn Huệ tìm quán mới. Em cười nhiều quá, anh chụp được vài tấm ưng ý.',
    date: new Date(Date.UTC(2026, 3, 25, 2, 30, 0)),
    loc: LOCS.sg,
    tags: ['ăn uống'],
    photoSeeds: ['sg-coffee-walk', 'sg-laugh'],
  },
  {
    title: 'Pizza và phim Ghibli',
    caption:
      'Một tối mưa, ở nhà, pizza nóng và Howl\'s Moving Castle. Không cần đi đâu xa.',
    date: new Date(Date.UTC(2026, 3, 21, 14, 0, 0)),
    loc: LOCS.sg,
    tags: [],
    photoSeeds: ['pizza-ghibli'],
  },
];

const LETTERS: Array<{
  senderId: string;
  recipientId: string;
  title: string;
  content: string;
  mood: string;
  deliveredAt: Date;
}> = [
  {
    senderId: PARTNER_USER_ID,
    recipientId: HUNG40_USER_ID,
    title: 'Cảm ơn anh vì tháng tư này',
    content:
      'Anh à, tháng tư đi nhanh quá. Mình đi nhiều nơi, ăn nhiều món, gặp nhiều người, mà em chỉ nhớ rõ những lúc anh quay sang nhìn em rồi cười. Cám ơn anh vì luôn là người chủ động kéo em ra khỏi nhà — em biết em hay từ chối, em hay nói "lười lắm", nhưng mỗi lần đi xong em đều cảm ơn. Yêu anh.',
    mood: '❤️',
    deliveredAt: new Date(Date.UTC(2026, 3, 6, 10, 0, 0)),
  },
  {
    senderId: HUNG40_USER_ID,
    recipientId: PARTNER_USER_ID,
    title: 'Em là buổi sáng anh đợi suốt đêm',
    content:
      'Có những buổi sáng Sài Gòn mưa dầm, anh ngồi đợi cà phê chảy, và bất giác anh nghĩ — nếu em không có ở đây, mọi thứ sẽ nhạt đi một chút. Em không phải là tất cả, em chỉ là cái nắm nhỏ níu mọi thứ lại với nhau. Mỗi sáng anh thức dậy thấy em ngủ bên cạnh, anh biết hôm đó sẽ ổn. Cảm ơn em vì đã ở lại.',
    mood: '☕',
    deliveredAt: new Date(Date.UTC(2026, 3, 14, 22, 0, 0)),
  },
  {
    senderId: PARTNER_USER_ID,
    recipientId: HUNG40_USER_ID,
    title: 'Một ghi chú nhỏ giữa chuyến đi',
    content:
      'Đang ngồi sân bay Changi chờ chuyến về. Singapore đẹp, nhưng phần đẹp nhất là anh đứng cạnh em chỉ vào hồ cá. Em chợt nghĩ — chỗ nào đi với anh cũng thấy thân thuộc. Mai về Sài Gòn, mình lại đi cà phê Bùi Viện sáng thứ Hai chứ?',
    mood: '🌸',
    deliveredAt: new Date(Date.UTC(2026, 3, 23, 8, 0, 0)),
  },
  {
    senderId: HUNG40_USER_ID,
    recipientId: PARTNER_USER_ID,
    title: 'Tổng kết tháng 4 — gửi em',
    content:
      'Tháng tư mình đi 4 chuyến đi, ăn không biết bao nhiêu món, viết cho nhau 3 lá thư (cái thứ 4 đang viết). Mỗi tối anh đều mở album hình ra xem lại, mình thật sự sống tháng này. Cảm ơn em đã cùng anh đi qua tháng này.',
    mood: '✨',
    deliveredAt: new Date(Date.UTC(2026, 3, 26, 13, 0, 0)),
  },
];

const QUESTIONS: Array<{ id: string; text: string; textVi: string }> = [
  { id: 'seed-q-smile', text: 'What made you smile today?', textVi: 'Hôm nay điều gì khiến em cười?' },
  { id: 'seed-q-grateful', text: 'What are you grateful for this week?', textVi: 'Tuần này em biết ơn điều gì nhất?' },
  { id: 'seed-q-future', text: 'Where do you want us to be a year from now?', textVi: 'Một năm nữa em muốn mình ở đâu?' },
];

const Q_RESPONSES: Array<{ questionId: string; userId: string; answer: string; createdAt: Date }> = [
  // smile — 4 responses (winner of topQuestion)
  { questionId: 'seed-q-smile', userId: HUNG40_USER_ID, answer: 'Em cười khi đứng cạnh anh ở Bãi Sau.', createdAt: new Date(Date.UTC(2026, 3, 3, 13, 0, 0)) },
  { questionId: 'seed-q-smile', userId: PARTNER_USER_ID, answer: 'Khi anh chụp được tấm em cười ở Nguyễn Huệ.', createdAt: new Date(Date.UTC(2026, 3, 3, 14, 0, 0)) },
  { questionId: 'seed-q-smile', userId: HUNG40_USER_ID, answer: 'Sáng phở Bát Đàn em ăn hết tô.', createdAt: new Date(Date.UTC(2026, 3, 8, 1, 0, 0)) },
  { questionId: 'seed-q-smile', userId: PARTNER_USER_ID, answer: 'Khi mưa Đà Lạt mà mình vẫn ngồi cà phê được 2 tiếng.', createdAt: new Date(Date.UTC(2026, 3, 22, 12, 0, 0)) },
  // grateful — 1 response
  { questionId: 'seed-q-grateful', userId: HUNG40_USER_ID, answer: 'Em biết ơn anh vì tuần nào cũng rủ em đi đâu đó.', createdAt: new Date(Date.UTC(2026, 3, 12, 4, 0, 0)) },
  // future — 1 response
  { questionId: 'seed-q-future', userId: PARTNER_USER_ID, answer: 'Em muốn mình ở Đà Lạt 1 tháng, không Wi-Fi.', createdAt: new Date(Date.UTC(2026, 3, 19, 5, 0, 0)) },
];

const DATE_PLANS: Array<{ title: string; date: Date }> = [
  { title: 'Đi Hà Nội 3 ngày', date: new Date(Date.UTC(2026, 3, 7, 0, 0, 0)) },
  { title: 'Bay Singapore 3 đêm', date: new Date(Date.UTC(2026, 3, 20, 0, 0, 0)) },
];

(async () => {
  const user = await prisma.user.findUnique({
    where: { id: HUNG40_USER_ID },
    select: { id: true, coupleId: true, name: true },
  });
  if (!user || user.coupleId !== COUPLE_ID) {
    console.error(`User mismatch — expected coupleId=${COUPLE_ID}`);
    process.exit(1);
  }
  console.log(`Seeding April for ${user.name} couple=${COUPLE_ID}`);

  // ─── Wipe + reseed moments ─────────────────────────────────────────
  const aprStart = new Date(Date.UTC(2026, 3, 1, 0, 0, 0));
  const aprEnd = new Date(Date.UTC(2026, 3, 30, 23, 59, 59));
  const purgedM = await prisma.moment.deleteMany({
    where: {
      coupleId: COUPLE_ID,
      date: { gte: aprStart, lte: aprEnd },
      title: { in: MOMENTS.map((m) => m.title) },
    },
  });
  console.log(`Purged ${purgedM.count} prior April moments`);

  for (const m of MOMENTS) {
    await prisma.moment.create({
      data: {
        coupleId: COUPLE_ID,
        authorId: m.authorId ?? HUNG40_USER_ID,
        title: m.title,
        caption: m.caption,
        date: m.date,
        latitude: m.loc.lat,
        longitude: m.loc.lng,
        location: m.loc.name,
        tags: m.tags,
        photos: {
          create: m.photoSeeds.map((seed, i) => ({
            filename: `seed-april-${seed}-${i}.jpg`,
            url: `https://picsum.photos/seed/${seed}/800/800`,
          })),
        },
      },
    });
  }
  console.log(`+ ${MOMENTS.length} moments`);

  // ─── Letters ───────────────────────────────────────────────────────
  const purgedL = await prisma.loveLetter.deleteMany({
    where: {
      coupleId: COUPLE_ID,
      deliveredAt: { gte: aprStart, lte: aprEnd },
      title: { in: LETTERS.map((l) => l.title) },
    },
  });
  console.log(`Purged ${purgedL.count} prior April letters`);
  for (const l of LETTERS) {
    await prisma.loveLetter.create({
      data: {
        coupleId: COUPLE_ID,
        senderId: l.senderId,
        recipientId: l.recipientId,
        title: l.title,
        content: l.content,
        mood: l.mood,
        status: 'DELIVERED',
        scheduledAt: l.deliveredAt,
        deliveredAt: l.deliveredAt,
      },
    });
  }
  console.log(`+ ${LETTERS.length} letters`);

  // ─── Daily Questions + responses ───────────────────────────────────
  for (const q of QUESTIONS) {
    await prisma.dailyQuestion.upsert({
      where: { id: q.id },
      update: { text: q.text, textVi: q.textVi },
      create: { id: q.id, text: q.text, textVi: q.textVi, category: 'general', order: 990 },
    });
  }
  // Wipe responses for these questions inside April for our couple, then
  // reseed.
  const purgedR = await prisma.dailyQuestionResponse.deleteMany({
    where: {
      coupleId: COUPLE_ID,
      questionId: { in: QUESTIONS.map((q) => q.id) },
      createdAt: { gte: aprStart, lte: aprEnd },
    },
  });
  console.log(`Purged ${purgedR.count} prior April Q responses`);
  for (const r of Q_RESPONSES) {
    // Schema has @@unique([questionId, coupleId, userId]) so the same
    // user can only answer a given question ONCE. Use upsert.
    await prisma.dailyQuestionResponse.upsert({
      where: {
        questionId_coupleId_userId: {
          questionId: r.questionId,
          coupleId: COUPLE_ID,
          userId: r.userId,
        },
      },
      update: { answer: r.answer, createdAt: r.createdAt },
      create: {
        questionId: r.questionId,
        coupleId: COUPLE_ID,
        userId: r.userId,
        answer: r.answer,
        createdAt: r.createdAt,
      },
    });
  }
  console.log(`+ ${Q_RESPONSES.length} Q responses (3 questions, 'smile' wins topQuestion at 4)`);

  // ─── Date plans ────────────────────────────────────────────────────
  const purgedDP = await prisma.datePlan.deleteMany({
    where: {
      coupleId: COUPLE_ID,
      date: { gte: aprStart, lte: aprEnd },
      title: { in: DATE_PLANS.map((d) => d.title) },
    },
  });
  console.log(`Purged ${purgedDP.count} prior April date plans`);
  for (const dp of DATE_PLANS) {
    await prisma.datePlan.create({
      data: {
        coupleId: COUPLE_ID,
        title: dp.title,
        date: dp.date,
      },
    });
  }
  console.log(`+ ${DATE_PLANS.length} date plans (drives trips count)`);

  console.log('April seed done.');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
