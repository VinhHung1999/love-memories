import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding love_scrum_dev...');

  // Create couple first
  const couple = await prisma.couple.upsert({
    where: { id: 'dev-couple' },
    update: {},
    create: { id: 'dev-couple', name: 'Dev Couple' },
  });
  console.log('Couple:', couple.id);
  const coupleId = couple.id;

  // Dev users (2 required for Love Letters partner lookup)
  const hashedPassword = await bcrypt.hash('dev123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'dev@love-scrum.local' },
    update: { coupleId },
    create: {
      email: 'dev@love-scrum.local',
      password: hashedPassword,
      name: 'Dev User',
      coupleId,
    },
  });
  console.log('User:', user.email, '/ password: dev123');

  await prisma.user.upsert({
    where: { email: 'partner@love-scrum.local' },
    update: { coupleId },
    create: {
      email: 'partner@love-scrum.local',
      password: hashedPassword,
      name: 'Partner Dev',
      coupleId,
    },
  });
  console.log('User: partner@love-scrum.local / password: dev123');

  // Test moments
  await prisma.moment.createMany({
    skipDuplicates: true,
    data: [
      {
        coupleId,
        title: 'Cà phê sáng Highlands',
        caption: 'Cùng nhau uống cà phê buổi sáng',
        date: new Date('2026-01-15'),
        location: 'Highlands Coffee, Quận 1',
        latitude: 10.7762,
        longitude: 106.701,
        tags: ['cafe', 'morning'],
      },
      {
        coupleId,
        title: 'Dạo biển Vũng Tàu',
        caption: 'Trip đầu năm 2026',
        date: new Date('2026-02-01'),
        location: 'Bãi Sau, Vũng Tàu',
        latitude: 10.34,
        longitude: 107.084,
        tags: ['beach', 'trip'],
      },
    ],
  });
  console.log('Moments: 2 created');

  // Test food spots
  await prisma.foodSpot.createMany({
    skipDuplicates: true,
    data: [
      {
        coupleId,
        name: 'Phở Hòa Pasteur',
        description: 'Phở nổi tiếng Sài Gòn',
        rating: 4.5,
        location: '260C Pasteur, Quận 3',
        latitude: 10.7756,
        longitude: 106.689,
        tags: ['pho', 'breakfast'],
        priceRange: 2,
      },
      {
        coupleId,
        name: 'Bún bò Huế O Xuân',
        description: 'Bún bò chuẩn vị Huế',
        rating: 4.2,
        location: '137 Lê Thánh Tôn, Quận 1',
        latitude: 10.7741,
        longitude: 106.701,
        tags: ['bun-bo', 'lunch'],
        priceRange: 1,
      },
    ],
  });
  console.log('Food spots: 2 created');

  // Test sprint
  await prisma.sprint.create({
    data: {
      coupleId,
      name: 'Sprint Dev Test',
      description: 'Sprint dùng để test tính năng',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-28'),
      status: 'ACTIVE',
      goals: {
        create: [
          { title: 'Test goal TODO', status: 'TODO', priority: 'HIGH', order: 0, coupleId },
          { title: 'Test goal IN_PROGRESS', status: 'IN_PROGRESS', priority: 'MEDIUM', order: 1, coupleId },
          { title: 'Test goal DONE', status: 'DONE', priority: 'LOW', order: 2, coupleId },
        ],
      },
    },
  });
  console.log('Sprint: 1 created with 3 goals');

  // Vietnamese recipes for "What to Eat Today" feature
  // Always clear and recreate so seed is idempotent on dev
  await prisma.cookingSession.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.recipe.createMany({
    data: [
        {
          coupleId,
          title: 'Phở Bò',
          description: 'Phở bò truyền thống Hà Nội với nước dùng ninh từ xương bò thơm ngon',
          tags: ['phở', 'súp', 'bò', 'bữa sáng'],
          ingredients: [
            '1 kg xương ống bò',
            '300g thịt bò tái (thăn hoặc nạm)',
            '400g bánh phở tươi',
            '1 củ hành tây lớn',
            '1 nhánh gừng lớn (khoảng 80g)',
            '3 cây quế',
            '5 hoa hồi',
            '3 nụ đinh hương',
            '2 thìa canh nước mắm',
            '1 thìa cà phê muối',
            '1 thìa cà phê đường phèn',
            'Hành lá, ngò gai, giá đỗ',
            'Chanh, ớt tươi để ăn kèm',
          ],
          steps: [
            'Chần xương bò qua nước sôi 5 phút, rửa sạch để loại bỏ bọt bẩn.',
            'Nướng hành tây và gừng trên lửa trực tiếp hoặc chảo khô đến khi cháy xém thơm.',
            'Cho xương vào nồi 4 lít nước, thêm hành tây, gừng đã nướng. Ninh lửa nhỏ 3–4 tiếng.',
            'Rang quế, hồi, đinh hương trên chảo khô 2 phút rồi cho vào túi vải, bỏ vào nồi nước dùng.',
            'Vớt bọt thường xuyên. Nêm nước mắm, muối, đường phèn cho vừa miệng.',
            'Thái mỏng thịt bò tái (để trong ngăn đông 20 phút cho dễ thái).',
            'Trụng bánh phở qua nước sôi 30 giây, cho vào tô.',
            'Xếp thịt bò tái lên trên. Chan nước dùng sôi trực tiếp để chín thịt.',
            'Ăn kèm giá đỗ, hành lá, ngò gai, chanh và ớt.',
          ],
          stepDurations: [300, 600, 10800, 120, 0, 1200, 30, 0, 0],
          notes: 'Bí quyết: nướng hành gừng thật cháy xém mới có màu vàng đẹp và thơm đặc trưng. Ninh xương càng lâu nước dùng càng ngọt.',
          tutorialUrl: 'https://www.youtube.com/watch?v=AlqTo1BDgPM',
        },
        {
          coupleId,
          title: 'Bún Bò Huế',
          description: 'Bún bò chuẩn vị Huế với nước dùng sả mắm ruốc cay thơm đậm đà',
          tags: ['bún bò', 'Huế', 'cay', 'bữa sáng'],
          ingredients: [
            '500g bắp bò (giò heo tùy chọn)',
            '200g chả cua hoặc chả Huế',
            '500g bún tươi',
            '3 cây sả đập dập',
            '2 thìa canh mắm ruốc Huế',
            '3 thìa canh dầu ăn',
            '1 củ hành tím',
            '2 thìa canh ớt sa tế',
            '1 thìa canh nước mắm',
            'Muối, đường vừa đủ',
            'Rau sống: bắp chuối bào, giá đỗ, rau muống chẻ, kinh giới',
            'Hành lá, ngò tàu thái nhỏ',
          ],
          steps: [
            'Chần bắp bò qua nước sôi 3 phút, rửa sạch.',
            'Hòa mắm ruốc với 100ml nước, lọc lấy nước trong.',
            'Cho bắp bò vào nồi 2.5 lít nước, thêm sả đập dập, nước mắm ruốc đã lọc. Đun sôi rồi hạ lửa ninh 90 phút.',
            'Phi thơm hành tím với dầu ăn, thêm sa tế ớt, đảo đều. Cho hỗn hợp này vào nồi nước dùng.',
            'Nêm nước mắm, muối, đường cho vừa miệng. Nước dùng phải có màu đỏ cam đẹp.',
            'Vớt bắp bò ra, để nguội rồi thái lát vừa ăn.',
            'Trụng bún qua nước sôi, cho vào tô. Xếp bắp bò và chả cua lên trên.',
            'Chan nước dùng sôi ngập mặt bún. Rắc hành lá, ngò tàu.',
            'Ăn kèm đĩa rau sống, vắt thêm chanh và ớt tươi nếu thích cay.',
          ],
          stepDurations: [180, 0, 5400, 120, 0, 600, 30, 0, 0],
          notes: 'Mắm ruốc là linh hồn của bún bò Huế — dùng mắm ruốc Huế chính hãng sẽ ngon hơn nhiều. Điều chỉnh lượng sa tế theo khẩu vị.',
          tutorialUrl: 'https://www.youtube.com/watch?v=qWK_HYlKrAA',
        },
        {
          coupleId,
          title: 'Cơm Tấm Sườn Bì Chả',
          description: 'Cơm tấm Sài Gòn đặc trưng với sườn nướng mật ong, bì trộn thính và chả trứng hấp',
          tags: ['cơm tấm', 'Sài Gòn', 'sườn', 'bữa trưa'],
          ingredients: [
            '400g sườn non cắt miếng vừa',
            '300g cơm tấm (gạo tấm)',
            '150g bì lợn (da heo)',
            '3 quả trứng',
            '100g thịt heo xay',
            '2 thìa canh mật ong',
            '3 thìa canh nước mắm',
            '2 tép tỏi băm nhỏ',
            '1 thìa canh dầu hào',
            'Thính gạo rang (bột gạo rang vàng)',
            'Đồ chua: cà rốt, củ cải muối chua',
            'Mỡ hành (hành lá + mỡ nước)',
            'Nước chấm: nước mắm, đường, chanh, tỏi ớt',
          ],
          steps: [
            'Ướp sườn: trộn đều nước mắm, mật ong, dầu hào, tỏi băm. Ướp sườn ít nhất 2 tiếng (hoặc qua đêm).',
            'Làm chả trứng: đánh trứng với thịt xay, nêm muối tiêu. Hấp cách thủy 20 phút đến khi chín.',
            'Luộc bì lợn đến khi mềm, vớt ra để nguội. Thái chỉ mỏng, trộn với thính gạo rang.',
            'Nướng sườn trên vỉ than hoặc lò nướng 200°C khoảng 25–30 phút, phết thêm nước ướp cho bóng và thơm.',
            'Nấu cơm tấm: vo gạo nhẹ tay, nấu với tỉ lệ nước 1:1.2.',
            'Pha nước chấm: 3 thìa nước mắm + 2 thìa đường + 2 thìa nước cốt chanh + 50ml nước ấm + tỏi ớt.',
            'Làm mỡ hành: phi hành lá với mỡ nước hoặc dầu ăn đến thơm.',
            'Bày đĩa: cơm tấm + sườn nướng + bì + chả trứng cắt miếng + đồ chua.',
            'Rưới mỡ hành lên mặt cơm. Dùng với bát nước chấm.',
          ],
          stepDurations: [7200, 1200, 1200, 1500, 1200, 0, 60, 0, 0],
          notes: 'Bí quyết sườn bóng đẹp: phết mật ong pha loãng lên sườn trước khi tắt lửa 5 phút. Cơm tấm ngon nhất khi còn nóng hổi.',
          tutorialUrl: 'https://www.youtube.com/watch?v=h0HkRXMu4_Q',
        },
        {
          coupleId,
          title: 'Bánh Xèo Miền Nam',
          description: 'Bánh xèo giòn rụm nhân tôm thịt ăn kèm rau sống và nước chấm chua ngọt',
          tags: ['bánh xèo', 'chiên', 'tôm', 'bữa chiều'],
          ingredients: [
            '200g bột gạo',
            '1 thìa cà phê bột nghệ',
            '200ml nước cốt dừa',
            '200ml nước lọc',
            '200g tôm tươi bóc vỏ',
            '150g thịt heo ba chỉ thái mỏng',
            '200g giá đỗ',
            '3 cây hành lá thái nhỏ',
            '2 thìa canh dầu ăn',
            'Rau sống ăn kèm: xà lách, húng quế, tía tô, chuối xanh thái lát',
            'Bánh tráng mỏng (tùy chọn)',
            'Nước chấm: nước mắm, đường, chanh, tỏi ớt, cà rốt bào',
          ],
          steps: [
            'Pha bột: trộn bột gạo, bột nghệ, nước cốt dừa và nước lọc thành hỗn hợp lỏng. Thêm hành lá thái nhỏ. Để nghỉ 30 phút.',
            'Ướp tôm và thịt với chút muối, tiêu, tỏi băm trong 15 phút.',
            'Pha nước chấm: 3 thìa nước mắm + 2 thìa đường + 2 thìa chanh + 100ml nước + tỏi ớt băm + cà rốt bào.',
            'Đun nóng chảo gang hoặc chảo chống dính với dầu ăn trên lửa to.',
            'Phi thơm hành rồi cho tôm và thịt vào xào sơ 2 phút.',
            'Đổ một vá bột vào chảo nóng, nghiêng chảo cho bột dàn đều thành lớp mỏng. Nghe tiếng xèo là đúng.',
            'Xếp nhân tôm thịt và giá đỗ lên một nửa bánh. Đậy nắp 2 phút.',
            'Mở nắp, chiên tiếp đến khi bánh vàng giòn. Gấp đôi bánh lại.',
            'Ăn kèm rau sống và nước chấm. Có thể cuốn với bánh tráng.',
          ],
          stepDurations: [1800, 900, 0, 60, 120, 0, 120, 180, 0],
          notes: 'Chảo phải thật nóng trước khi đổ bột mới có tiếng xèo và bánh giòn. Nước cốt dừa giúp bánh thơm và giòn hơn bột thường.',
          tutorialUrl: 'https://www.youtube.com/watch?v=AF9H5hpTrSA',
        },
        {
          coupleId,
          title: 'Gỏi Cuốn Tôm Thịt',
          description: 'Gỏi cuốn tươi mát với tôm luộc, thịt heo, bún và rau sống, chấm tương hoisin đậu phộng',
          tags: ['gỏi cuốn', 'tươi', 'tôm', 'lành mạnh'],
          ingredients: [
            '300g tôm tươi còn vỏ',
            '200g thịt heo ba chỉ',
            '200g bún tươi',
            '12 tờ bánh tráng gạo (loại mỏng)',
            '1 bó xà lách',
            '1 bó húng quế',
            '1 bó tía tô',
            '1 củ cà rốt bào sợi',
            '1 dưa leo thái sợi',
            'Hẹ (tùy chọn)',
            'Nước chấm: 3 thìa tương hoisin + 2 thìa tương đậu phộng + 1 thìa đường + nước ấm + tỏi ớt',
            'Đậu phộng rang giã nhỏ để rắc',
          ],
          steps: [
            'Luộc thịt heo: cho vào nồi nước lạnh với 1 thìa muối và vài lát gừng. Đun đến khi chín (khoảng 25 phút). Vớt ra để nguội.',
            'Luộc tôm: chần tôm vào nước sôi có muối khoảng 3–4 phút đến khi tôm hồng và cong. Bóc vỏ, bổ đôi theo chiều dọc.',
            'Thái thịt heo thành lát mỏng vừa cuốn.',
            'Trụng bún qua nước sôi, để ráo.',
            'Rửa sạch và để ráo các loại rau. Cắt xà lách thành miếng vừa.',
            'Pha nước chấm: trộn hoisin, tương đậu phộng, đường và chút nước ấm cho sánh. Thêm tỏi ớt băm.',
            'Nhúng bánh tráng vào chậu nước ấm khoảng 5–8 giây (vừa mềm, không bị nhũn).',
            'Cuốn theo thứ tự: xà lách, rau thơm, bún, thịt, tôm đỏ lên trên (để nhìn thấy qua bánh). Cuốn chặt tay.',
            'Bày ra đĩa, chấm với tương hoisin đậu phộng. Rắc đậu phộng rang lên trên.',
          ],
          stepDurations: [1500, 240, 0, 30, 0, 0, 8, 0, 0],
          notes: 'Bánh tráng nhúng đúng độ: không quá mềm (dễ rách) cũng không quá cứng. Cuốn ngay sau khi nhúng. Ăn trong ngày, không để qua đêm.',
          tutorialUrl: 'https://www.youtube.com/watch?v=0n9rXR9CSu4',
        },
      ],
    });
    console.log('Recipes: 5 Vietnamese recipes created with tutorialUrl');

  // ── W08 2026 recap seed data (2026-02-16 → 2026-02-22) ────────────────────
  const partner = await prisma.user.findUnique({ where: { email: 'partner@love-scrum.local' } });
  const firstRecipe = await prisma.recipe.findFirst({ where: { title: 'Phở Bò' } });

  // 3 moments with photos
  const w08Moments = [
    { title: 'Ăn sáng cùng nhau', date: new Date('2026-02-17'), tags: ['sáng', 'cafe'], photo: 'seed-photo-1.jpg' },
    { title: 'Đi dạo công viên',  date: new Date('2026-02-19'), tags: ['dạo', 'park'],  photo: 'seed-photo-2.jpg' },
    { title: 'Nấu ăn tối thứ 7',  date: new Date('2026-02-21'), tags: ['nấu ăn', 'tối'], photo: 'seed-photo-3.jpg' },
  ];
  for (const m of w08Moments) {
    await prisma.moment.create({
      data: {
        coupleId,
        title: m.title,
        date: m.date,
        tags: m.tags,
        photos: { create: [{ filename: m.photo, url: `/uploads/${m.photo}` }] },
      },
    });
  }
  console.log('W08 Moments: 3 created with photos');

  // 1 completed cooking session
  if (firstRecipe) {
    await prisma.cookingSession.create({
      data: {
        coupleId,
        status: 'completed',
        completedAt: new Date('2026-02-20'),
        totalTimeMs: 5400000,
        recipes: { create: [{ recipeId: firstRecipe.id, order: 0 }] },
      },
    });
    console.log('W08 CookingSession: 1 completed created');
  }

  // 1 food spot with W08 createdAt
  await prisma.foodSpot.create({
    data: {
      coupleId,
      name: 'Bánh mì Phượng',
      description: 'Bánh mì ngon nhất Hội An',
      rating: 4.8,
      location: '2B Phan Châu Trinh, Hội An',
      latitude: 15.8801,
      longitude: 108.335,
      tags: ['bánh mì', 'sáng'],
      priceRange: 1,
      createdAt: new Date('2026-02-18'),
    },
  });
  console.log('W08 FoodSpot: 1 created');

  // 1 date plan in W08
  await prisma.datePlan.create({
    data: {
      coupleId,
      title: 'Cafe date cuối tuần',
      date: new Date('2026-02-22'),
      status: 'planned',
    },
  });
  console.log('W08 DatePlan: 1 created');

  // 2 love letters (DELIVERED) in W08
  if (partner) {
    await prisma.loveLetter.createMany({
      data: [
        {
          coupleId,
          senderId: user.id,
          recipientId: partner.id,
          title: 'Thư yêu thương',
          content: 'Em yêu anh nhiều lắm! Cảm ơn vì mọi thứ anh đã làm cho em.',
          status: 'DELIVERED',
          deliveredAt: new Date('2026-02-18'),
        },
        {
          coupleId,
          senderId: partner.id,
          recipientId: user.id,
          title: 'Nhớ em quá',
          content: 'Anh nhớ em lắm, em ơi! Mỗi ngày được ở bên em là một ngày hạnh phúc.',
          status: 'DELIVERED',
          deliveredAt: new Date('2026-02-20'),
        },
      ],
    });
    console.log('W08 LoveLetters: 2 DELIVERED created');
  }

  // Update existing DONE goal's updatedAt to fall in W08
  await prisma.$executeRaw`
    UPDATE "goals" SET "updatedAt" = '2026-02-19 00:00:00+00'
    WHERE id = (SELECT id FROM "goals" WHERE status = 'DONE' ORDER BY "createdAt" DESC LIMIT 1)
  `;
  console.log('W08 Goal DONE: updatedAt set to 2026-02-19');

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
