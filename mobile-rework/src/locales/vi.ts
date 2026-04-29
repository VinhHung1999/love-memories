// Ported from docs/design/prototype/memoura-v2/tokens.jsx COPY.vi.
// Double-brace interpolation per react-i18next convention: {{name}}.
//
// T305 — Editorial pass: subject "em" → "mình" for self-reference (gender-neutral,
// matches Boss preference). Partner-referring tokens preserved verbatim:
//   - "người ấy", "người ta" (third-person partner refs)
//   - "hai đứa mình", "hai đứa", "chúng mình" (couple-collective)
//   - "{{partner}}" interpolation
//   - Letter prose addressed to the partner (intro.slides.letters.body)
// Where the original chained both subjects ("em ... mình ..." in one sentence),
// rewritten to avoid double-"mình" awkwardness rather than mechanically substituted.

const vi = {
  common: {
    cancel: 'Huỷ',
    save: 'Lưu',
    done: 'Xong',
    back: 'Quay lại',
    continue: 'Tiếp tục',
    skip: 'Bỏ qua',
    loading: 'Đang tải…',
    // Sprint 61 T344 — shared ComingSoonSheet. Used by 4 Profile settings rows
    // (Kỷ niệm, Giao diện, Memoura+, Xem hướng dẫn) until those features ship.
    comingSoon: {
      title: 'Sắp có ✨',
      defaultBody: 'Memoura đang chăm chút phần này. Mình chờ một chút nhé.',
      close: 'Đóng',
    },
  },
  tabs: {
    home: 'Nhà',
    moments: 'Khoảnh khắc',
    letters: 'Thư',
    profile: 'Mình',
  },
  home: {
    greeting: 'Chào {{name}},',
    greetingTime: 'sáng nay trời đẹp ghê',
    timerLabel: 'Chúng mình đã bên nhau',
    units: {
      y: 'năm',
      m: 'tháng',
      d: 'ngày',
      h: 'giờ',
      min: 'phút',
      s: 'giây',
    },
    countdown: '{{n}} ngày nữa là kỷ niệm ♥',
    dailyQTitle: 'Hỏi nhau',
    dailyQ: 'Nếu được tặng nhau một buổi chiều bất kỳ, mình muốn cùng làm gì nhỉ?',
    dailyQCta: 'Trả lời',
    dailyQPartnerPending: 'Đang đợi {{partner}}',
    dailyQPartnerAnswered: '{{partner}} đã trả lời · chạm để xem',
    dailyQYouPending: '{{partner}} đã trả lời trước',
    dailyQBothAnswered: 'Hai đứa đều xong ✓',
    dailyQStreak: 'Chuỗi {{days}} ngày',
    latestFrom: '{{partner}} vừa thêm một khoảnh khắc',
    latestAgo: '{{n}} giờ trước',
    recapTitle: 'Tháng {{month}} của mình',
    recapSub: '{{moments}} khoảnh khắc · {{letters}} lá thư · {{trips}} chuyến đi',
    recapCta: 'Xem lại',
    // Sprint 67 T455 — Dashboard banner pin (last 3 days of month + first 3
    // of next month). Tap → /recap/monthly?month=YYYY-MM.
    recapBanner: {
      kicker: 'RECAP · {{name}}',
      title: '{{name}} của mình',
      sub: 'Nhìn lại tháng vừa qua',
    },
    modulesTitle: 'Cùng nhau',
    modules: {
      moments: 'Khoảnh khắc',
      letters: 'Thư tình',
      dailyQ: 'Hỏi nhau',
      recap: 'Nhìn lại',
    },
    quickAdd: 'Ghi lại ngay',
    shareCode: {
      title: 'Mời người ấy vào Memoura',
      subtitle: 'Cho người ấy mã này để cùng mình gieo những khoảnh khắc.',
      codeLabel: 'Mã của hai đứa',
      shareCta: 'Chia sẻ',
      copyCta: 'Sao chép',
      copied: 'Đã sao chép ✓',
      regenerateCta: 'Tạo mã mới',
      regenerating: 'Đang tạo...',
      regenerateTitle: 'Đổi mã mới?',
      regenerateBody: 'Mã cũ sẽ ngừng hoạt động. Người ấy sẽ cần mã mới để vào cùng mình.',
      regenerateCancel: 'Không',
      regenerateConfirm: 'Đổi mã',
      shareMessage: 'Mình đang đợi người ấy trên Memoura nè. Mã: {{code}}\n{{url}}',
      error: 'Không tải được mã. Chạm để thử lại.',
    },
    // T375 — Dashboard empty state (polaroid hero) + latest moment card
    empty: {
      title: 'Trang đầu của hai đứa',
      subtitle: 'Chụp một tấm, viết một câu — rồi một ngày nào đó hai đứa sẽ lật lại và cười.',
      ctaPrimary: 'Thêm khoảnh khắc',
      ctaSecondary: 'Mở camera',
      polaroidCaption: 'khoảnh khắc #1',
    },
    latest: {
      eyebrow: 'Khoảnh khắc mới nhất',
      viewAll: 'Xem tất cả',
    },
  },
  compose: {
    title: 'Tạo mới',
    moment: 'Khoảnh khắc',
    letter: 'Viết thư',
    booth: 'Photo Booth',
    // T377 — camera pill action sheet. Three rows: quick camera, library
    // picker, stubbed Photobooth (dimmed until Sprint 64).
    cameraSheet: {
      title: 'Ghi lại cùng nhau',
      subtitle: 'Chọn cách mình muốn bắt khoảnh khắc này',
      takePhoto: 'Chụp ảnh',
      takePhotoSub: 'Bật camera, chụp ngay một tấm',
      pickLibrary: 'Chọn từ thư viện',
      pickLibrarySub: 'Thêm tối đa {{max}} ảnh đã có',
      photobooth: 'Photo Booth',
      photoboothSub: '4 ảnh · đếm ngược 3 giây',
      permission: {
        cameraDenied: 'Memoura cần quyền truy cập máy ảnh để chụp khoảnh khắc. Mở Cài đặt để bật nhé.',
        libraryDenied: 'Memoura cần quyền truy cập thư viện ảnh để thêm khoảnh khắc. Mở Cài đặt để bật nhé.',
        openSettings: 'Mở Cài đặt',
        cancel: 'Để sau',
      },
    },
    // T404 — photobooth screen
    photobooth: {
      headline: 'Dải ảnh của riêng hai đứa',
      captureNow: 'Chụp ngay bây giờ',
      captureNowSub: '4 ảnh · đếm ngược 3 giây',
      fromGallery: 'Từ thư viện',
      fromGallerySub: 'Chọn 1–4 ảnh có sẵn',
      shotCounter: '{{current}} / {{total}}',
      start: 'Bắt đầu',
      accept: 'Dùng ngay 💌',
      retake: 'Chụp lại',
      saving: 'Đang lưu…',
      permCamera: 'Memoura cần quyền máy ảnh để chụp Photo Booth.',
      permLibrary: 'Memoura cần quyền lưu ảnh để lưu dải ảnh.',
      grant: 'Cấp quyền',
    },
    // T378 — create moment screen (photos + description + date). Submit
    // dismisses the modal immediately and hands upload off to uploadQueue
    // which the global UploadProgressToast renders.
    momentCreate: {
      title: 'Khoảnh khắc mới',
      heroTitle: 'Giữ lại',
      heroSubtitle: '{{date}} · {{partner}} sẽ thấy',
      titlePlaceholder: 'Một cái tên…',
      partnerFallback: 'nửa kia',
      save: 'Lưu',
      savePartner: 'Lưu → {{partner}} sẽ thấy',
      editHeroTitle: 'Chỉnh sửa',
      editSaveLabel: 'Lưu thay đổi',
      editLoadError: 'Không tải được khoảnh khắc. Thử lại nhé.',
      close: 'Đóng',
      photosLabel: 'Ảnh',
      photosCount: '{{count}}/{{max}}',
      addMore: 'Thêm ảnh',
      removePhoto: 'Bỏ ảnh này',
      descriptionLabel: 'Mô tả',
      descriptionPlaceholder: 'Chuyện này là của ai, hôm đó trời thế nào…',
      dateLabel: 'Ngày',
      dateToday: 'Hôm nay',
      datePickerConfirm: 'Xong',
      submitError: 'Không lưu được. Thử lại nhé.',
      autoTitleFallback: 'Khoảnh khắc {{date}}',
      tagAddLabel: 'tag',
      tagAddPrompt: 'Thêm nhãn',
      tagAddConfirm: 'Thêm',
      tagInputPlaceholder: 'Ví dụ: dulich',
      tagEmpty: 'Nhãn không được để trống.',
      tagTooLong: 'Nhãn phải dưới {{max}} ký tự.',
      tagDuplicate: 'Nhãn này đã có rồi.',
      location: {
        addLabel: 'Thêm địa điểm',
        editLabel: 'Địa điểm: {{name}}',
        sheetTitle: 'Ở đâu nhỉ?',
        searchPlaceholder: 'Tìm địa điểm…',
        clearQuery: 'Xoá tìm kiếm',
        useGps: 'Dùng vị trí hiện tại',
        clear: 'Xoá địa điểm',
        initialHint: 'Gõ tên quán, đường, hoặc dùng vị trí hiện tại.',
        noResults: 'Không tìm thấy địa điểm nào. Thử từ khoá khác nhé.',
        searchError: 'Mạng đang trục trặc. Thử lại trong giây lát.',
        gpsError: {
          permission: 'Mình cần quyền vị trí để tự động điền. Vào Cài đặt để bật nhé.',
          unavailable: 'Không xác định được địa điểm từ vị trí hiện tại.',
          network: 'Mạng đang trục trặc. Thử lại nhé.',
        },
        mapLinkHint: 'Chạm để dùng liên kết này làm địa điểm',
      },
    },
    // T378 — global upload toast. T391 (Sprint 62): serial upload gate means
    // progress is X/Y, not count-only. `uploading` expects {{current}} + {{total}};
    // `failed` expects {{failed}} + {{total}}; `done` keeps {{count}}=successCount.
    uploadToast: {
      uploading: 'Đang tải lên {{current}}/{{total}} ảnh',
      done: 'Đã tải {{count}} ảnh',
      failed: 'Không tải được {{failed}}/{{total}} ảnh',
      // D48 (Sprint 65 Build 77 hot-fix): voice memo variant — toast picks the
      // audio copy when every active entry has kind='audio' so the user
      // doesn't see "Đang tải ảnh" while a recording is uploading.
      uploadingAudio: 'Đang tải lên giọng nói…',
      doneAudio: 'Đã tải xong giọng nói',
      failedAudio: 'Không tải được giọng nói',
      retry: 'Thử lại',
      dismiss: 'Đóng',
    },
  },
  // T379 / T376 — Moments list + Detail strings.
  moments: {
    detail: {
      title: 'Khoảnh khắc',
      back: 'Quay lại',
      error: 'Không tải được khoảnh khắc. Thử lại nhé.',
      notFound: 'Không tìm thấy khoảnh khắc này.',
      retry: 'Thử lại',
      justNow: 'Vừa xong',
      comingSoon: 'Sắp có rồi nhé',
      more: {
        edit: 'Chỉnh sửa',
        delete: 'Xóa khoảnh khắc',
        cancel: 'Huỷ',
      },
      deleteAlert: {
        title: 'Xóa khoảnh khắc này?',
        body: 'Khoảnh khắc và tất cả ảnh bên trong sẽ mất vĩnh viễn.',
        cancel: 'Huỷ',
        confirm: 'Xóa',
      },
      deleteError: {
        title: 'Không xóa được',
        body: 'Có lỗi xảy ra. Thử lại sau nhé.',
      },
      updated: 'Đã cập nhật',
      reactions: {
        signInHint: 'Đăng nhập để gửi cảm xúc',
      },
      comments: {
        title: 'Bình luận',
        empty: 'Chưa có bình luận nào. Viết gì đó cho nhau nhé.',
        placeholder: 'Viết gì đó cho {{partner}}…',
        sendLabel: 'Gửi',
        postError: 'Không gửi được. Thử lại sau nhé.',
        deleteAlert: {
          title: 'Xóa bình luận này?',
          body: 'Bình luận sẽ mất, không khôi phục được.',
          cancel: 'Huỷ',
          confirm: 'Xóa',
        },
        deleteError: 'Không xóa được. Thử lại sau nhé.',
      },
      lightbox: {
        download: 'Tải về',
        downloadSuccess: 'Đã lưu vào Ảnh',
        downloadError: 'Tải về thất bại. Thử lại sau nhé.',
        permissionDenied: 'Cần cấp quyền truy cập Ảnh để lưu.',
      },
    },
    list: {
      eyebrow: 'Album chung',
      title: 'Khoảnh khắc',
      error: 'Không tải được danh sách. Thử lại nhé.',
      retry: 'Thử lại',
      morePhotos: '+{{count}}',
      empty: {
        eyebrow: 'Album chung',
        calendarWaiting: 'lịch đang đợi được lấp đầy',
        title: 'Chưa có khoảnh khắc nào',
        subtitle:
          'Một tấm ảnh, một dòng chú thích — tất cả sẽ được giữ lại, đúng như hôm nay.',
        cta: 'Tạo khoảnh khắc đầu tiên',
        whisperPrefix: '{{name}} cũng chưa thêm gì. ',
        whisperTail: 'Cùng bắt đầu?',
        whisperSoloPrefix: 'Mình bắt đầu từ đâu cũng được. ',
        whisperSoloTail: 'Thêm khoảnh khắc đầu tiên?',
      },
      // T384 — calendar view (month grid + filtered day content)
      view: {
        month: 'Tháng',
        week: 'Tuần',
      },
      nav: {
        prevMonth: 'Tháng trước',
        nextMonth: 'Tháng sau',
      },
      selected: {
        count: '{{count}} khoảnh khắc',
        emptyTitle: 'Chưa có gì hôm này',
        emptySubtitle: 'Nhưng chắc chắn có gì đó đã xảy ra…',
      },
      legend: {
        hasMoments: 'Có khoảnh khắc',
        multiple: 'Nhiều khoảnh khắc',
        dayCount: '{{count}} ngày',
      },
    },
  },
  // T421 (Sprint 65) — Letters Inbox 4-tab + hero envelope + compact rows.
  // Header eyebrow uses Dancing Script per mobile-rework Hard Rule #5.
  letters: {
    eyebrow: 'Chỉ hai mình đọc',
    title: 'Thư tình',
    write: 'Viết',
    heroGreeting: 'Gửi',
    tapToOpen: 'Chạm để mở →',
    unreadPill: 'Chưa đọc',
    draftChip: 'Nháp',
    partnerFallback: 'người ấy',
    currentUserFallback: 'mình',
    tabs: {
      inbox: 'Hộp thư',
      sent: 'Đã gửi',
      drafts: 'Nháp',
    },
    empty: {
      cta: 'Viết thư mới',
      inbox: {
        title: 'Hộp thư còn trống',
        subtitle: 'Chưa có lá thư nào từ {{partner}}. Khi {{partner}} gửi, mình sẽ thấy ngay ở đây.',
      },
      sent: {
        title: 'Mình chưa gửi thư nào',
        subtitle: 'Có những điều khó nói thành lời — viết một lá thư cho {{partner}} nhé.',
      },
      drafts: {
        title: 'Không có nháp nào',
        subtitle: 'Mọi lá thư đang viết dở sẽ nằm ở đây để mình tiếp tục bất cứ lúc nào.',
      },
    },
    error: {
      message: 'Không tải được thư. Mình thử lại nhé?',
      retry: 'Thử lại',
    },
    // T423 (Sprint 65) — Letter Compose strings (mood + title + body +
    // photos + audio + schedule + discard).
    compose: {
      title: 'Thư mới',
      subtitle: 'Gửi cho {{partner}}',
      to: 'Gửi đến',
      moodLabel: 'Tâm trạng',
      titlePlaceholder: 'Gửi người của em…',
      bodyPlaceholder: 'Anh ơi,\n\nSáng nay em dậy sớm…',
      continueHint: 'Viết tiếp…',
      sendCta: 'Gửi',
      photoCounter: 'Ảnh',
      attach: {
        photos: 'Ảnh',
        audio: 'Giọng nói',
      },
      audioSheet: {
        title: 'Ghi âm cho lá thư',
        hint: 'Bấm để bắt đầu — tối đa 60 giây.',
        start: 'Bấm để ghi âm',
        stop: 'Bấm để dừng',
        permDenied: 'Memoura cần quyền micro để ghi âm.',
      },
      discardSheet: {
        title: 'Lưu hay bỏ thư này?',
        body: 'Mình đã viết một chút rồi. Lưu nháp để viết tiếp sau, hay bỏ luôn?',
        save: 'Lưu nháp',
        discard: 'Bỏ',
        cancel: 'Tiếp tục viết',
      },
      toast: {
        sent: 'Đã gửi cho {{partner}} ♥',
        error: {
          empty: 'Mình viết một chút trước nhé.',
          network: 'Không gửi được. Mạng có vấn đề?',
          unknown: 'Lỗi rồi. Mình thử lại nhé.',
        },
      },
      error: {
        message: 'Không tạo được thư mới. Mình thử lại sau nhé.',
        back: 'Quay lại',
      },
    },
    // T422 (Sprint 65) — Letter Read overlay strings.
    read: {
      fromAuthor: 'Từ {{name}} · viết lúc {{time}}',
      signaturePrefix: '—',
      reply: {
        eyebrow: 'Viết lại cho mình',
        body: 'Một lá thư xứng đáng một lá thư…',
        write: 'Viết thư',
      },
      error: {
        message: 'Không mở được lá thư. Mình thử lại nhé?',
        retry: 'Thử lại',
        back: 'Quay lại',
      },
    },
  },
  // T425 (Sprint 65) — Notifications inbox.
  notifications: {
    title: 'Thông báo',
    subtitle: {
      new: '{{count}} thông báo mới',
      allCaught: 'Mình đã xem hết rồi',
    },
    tabs: {
      all: 'Tất cả',
      us: 'Đôi mình',
      reminders: 'Nhắc nhở',
    },
    markAllRead: 'Đánh dấu đã đọc',
    groups: {
      today: 'Hôm nay',
      yesterday: 'Hôm qua',
      earlier: 'Trước đó',
    },
    anniv: {
      eyebrow: 'Sắp tới',
      title: 'Còn {{count}} ngày nữa là kỷ niệm',
      subtitle: 'Memoura đang chuẩn bị một recap đặc biệt cho hai mình ♥',
      cta: 'Xem chi tiết',
    },
    empty: {
      title: 'Chưa có thông báo nào',
      subtitle: 'Khi có khoảnh khắc, lá thư hay bình luận mới, mình sẽ thấy ở đây.',
    },
    error: {
      message: 'Không tải được thông báo. Mình thử lại nhé?',
      retry: 'Thử lại',
    },
    settings: {
      title: 'Cài đặt thông báo',
      subtitle: 'Chọn những gì mình muốn được nhắc',
    },
  },
  auth: {
    welcomeTitle: 'Chào mừng đến Memoura',
    welcomeSub: 'Nơi giữ lại những điều bé nhỏ của hai đứa.',
    signIn: 'Đăng nhập',
    signUp: 'Tạo tài khoản',
    continueWithApple: 'Tiếp tục với Apple',
    continueWithGoogle: 'Tiếp tục với Google',
    email: 'Email',
    password: 'Mật khẩu',
    forgot: 'Quên mật khẩu?',
  },
  onboarding: {
    welcome: {
      accent: 'chào mừng',
      title: 'Memoura',
      body: 'Không gian chỉ của hai đứa mình — nơi mỗi khoảnh khắc, mỗi dòng thư, mỗi câu hỏi đều có chỗ để ở lại.',
      ctaPrimary: 'Bắt đầu câu chuyện của mình',
      ctaSecondary: 'Mình đã có tài khoản',
      polaroidLabels: {
        one: 'Đà Lạt · 12.02',
        two: 'Cà phê sáng',
        three: 'Anniversary',
      },
      legal: {
        prefix: 'Bằng cách tiếp tục, mình đồng ý với ',
        terms: 'Điều khoản',
        and: ' và ',
        privacy: 'Chính sách bảo mật',
        suffix: '.',
      },
    },
    auth: {
      or: 'hoặc',
      signup: {
        title: 'Tạo tài khoản',
        subtitle: 'Chỉ hai đứa mình thấy nhau',
        accent: 'cùng bắt đầu nhé',
        nameLabel: 'Tên của mình',
        namePlaceholder: 'Linh',
        emailLabel: 'Email',
        emailPlaceholder: 'linh@memoura.co',
        passwordLabel: 'Mật khẩu',
        passwordPlaceholder: 'Ít nhất {{min}} ký tự',
        confirmPasswordLabel: 'Nhập lại mật khẩu',
        confirmPasswordPlaceholder: 'Gõ lại cho chắc nhé',
        show: 'Hiện',
        hide: 'Ẩn',
        termsLead: 'Khi tiếp tục, mình đồng ý với ',
        termsLink: 'Điều khoản',
        termsAnd: ' và ',
        privacyLink: 'Quyền riêng tư',
        termsTail: '.',
        cta: 'Tiếp theo',
        switchPrompt: 'Đã có tài khoản? ',
        switchAction: 'Đăng nhập',
        socialApple: 'Apple',
        socialGoogle: 'Google',
        socialPhone: 'SĐT',
      },
      login: {
        title: 'Chào mừng lại',
        subtitle: 'Người ấy đang đợi mình',
        emailLabel: 'Email hoặc tên',
        emailPlaceholder: 'linh@memoura.co',
        passwordLabel: 'Mật khẩu',
        passwordPlaceholder: 'Mật khẩu của mình',
        forgot: 'Quên mật khẩu?',
        cta: 'Đăng nhập',
        switchPrompt: 'Chưa có tài khoản? ',
        switchAction: 'Tạo tài khoản',
      },
      forgot: {
        title: 'Quên mất rồi',
        subtitle: 'Không sao, Memoura gửi lại cho',
        instructions:
          'Mình nhập email đã dùng để đăng ký. Memoura sẽ gửi một liên kết để mình đặt lại mật khẩu.',
        emailLabel: 'Email',
        emailPlaceholder: 'linh@memoura.co',
        cta: 'Gửi liên kết',
        sentTitle: 'Đã gửi rồi',
        sentBody:
          'Memoura đã gửi liên kết đặt lại mật khẩu tới {{email}}. Kiểm tra hộp thư nhé.',
        backToLogin: 'Về đăng nhập',
      },
      errors: {
        nameRequired: 'Cho Memoura biết tên của mình nhé',
        emailInvalid: 'Email chưa đúng định dạng',
        passwordTooShort: 'Mật khẩu cần ít nhất {{min}} ký tự',
        passwordRequired: 'Nhập mật khẩu của mình nhé',
        passwordMismatch: 'Hai lần mật khẩu chưa khớp',
        invalidCredentials: 'Email hoặc mật khẩu chưa đúng',
        emailTaken: 'Email này đã được đăng ký rồi',
        rateLimited: 'Mình thử lại sau một chút nhé',
        network: 'Mạng đang trục trặc. Mình thử lại sau nhé.',
        socialFailed: 'Đăng nhập chưa thành. Mình thử lại sau nhé.',
      },
      comingSoon: {
        title: 'Sắp ra mắt',
        body: 'Memoura vẫn đang chăm chút phần này. Mình dùng email trước nhé.',
        ok: 'OK',
      },
      pendingPair: {
        banner: 'Mình có lời mời ghép đôi {{code}} — đăng nhập để tiếp tục',
      },
    },
    pairing: {
      choice: {
        kicker: 'chỉ còn một bước',
        title: 'Cho ai\nnữa, nhỉ?',
        body: 'Memoura chỉ có hai người. Chọn một thôi.',
        create: {
          kicker: 'Em đi trước',
          title: 'Tạo lời mời',
          desc: 'Mã 8 chữ để gửi cho người ta.',
        },
        join: {
          kicker: 'Có mã rồi',
          title: 'Nhập mã',
          desc: 'Người ta đã gửi mã cho bạn.',
        },
        privacy: 'Một người ↔ một người. Không bạn bè, không feed.',
      },
      invite: {
        title: 'Mã ghép đôi',
        subtitle: 'Gửi mã này cho người ta nhé',
        codeLabel: 'mã của mình',
        shareCta: 'Chia sẻ',
        continueCta: 'Mình đã gửi rồi, tiếp tục',
        regenerating: 'Đang đổi mã…',
        regenerate: {
          cta: 'Lấy mã mới?',
          title: 'Đổi mã mới?',
          body: 'Mã cũ sẽ không còn hiệu lực. Người ta sẽ cần mã mới để vào.',
          confirm: 'Đổi mã',
          cancel: 'Huỷ',
        },
        shareMessage:
          'Mình đợi em ở Memoura ✨ Mở link để vào: {{url}} (hoặc nhập mã {{code}} trong app)',
      },
      join: {
        title: 'Nhập mã của người ta',
        subtitle: 'Tám ký tự, Memoura sẽ tự gán hoa',
        cta: 'Ghép đôi',
        ctaIcon: '💞',
        joining: 'Đang ghép đôi…',
        partnerHint: 'Mình sẽ ghép với {{name}}',
        scan: {
          cta: 'Quét mã QR của người ta',
          permissionTitle: 'Cần camera',
          permissionBody:
            'Memoura cần camera để quét mã QR. Mình mở Cài đặt để cho phép nhé.',
          permissionCancel: 'Huỷ',
          permissionOpenSettings: 'Mở Cài đặt',
          invalidCode: 'Mã QR không hợp lệ.',
          close: 'Đóng',
          hint: 'Đưa camera vào mã QR của người ta',
        },
      },
      errors: {
        network: 'Mạng đang trục trặc. Mình thử lại nhé.',
        invalidCode: 'Mã không đúng. Mình kiểm tra lại nhé.',
        codeUsed: 'Mã này đã được dùng rồi.',
        rateLimited: 'Hơi nhanh quá, đợi một chút rồi thử lại nhé.',
        alreadyPaired: 'Mình đã ghép với người khác rồi.',
      },
    },
    coupleForm: {
      title: 'Về hai đứa',
      subtitle: 'Một ngày, một cái tên, một câu',
      required: 'Bắt buộc',
      optional: 'Tuỳ chọn',
      dateLabel: 'Ngày kỷ niệm',
      datePlaceholder: '14.02.2023',
      dateHelp: 'Ngày hai đứa chính thức bắt đầu. Sẽ thấy mỗi sáng.',
      nameLabel: 'Tên cặp đôi',
      nameIcon: '♡',
      namePlaceholder: 'Ourcouple',
      nameSuggestions: ['Hai đứa nhỏ', 'Nhà mình', 'Ourcouple', 'Đôi mình'],
      sloganLabel: 'Câu của hai đứa',
      sloganIcon: '✎',
      sloganPlaceholder: 'một câu nhỏ thôi',
      sloganSuggestions: ['còn lâu mới hết', 'mãi mãi là 2', 'một mái, hai trái tim'],
      cta: 'Tạo lời mời',
      saving: 'Đang lưu…',
      helper: 'Có thể đổi lại bất cứ lúc nào',
      preview: {
        since: 'từ ngày {{date}}',
        namePlaceholder: 'Tên hai đứa',
        sloganPlaceholder: 'một câu của riêng hai đứa',
      },
      errors: {
        dateRequired: 'Ngày kỷ niệm là bắt buộc.',
        dateInvalid: 'Ngày chưa đúng định dạng (DD.MM.YYYY).',
        nameTooLong: 'Tên hơi dài — gọn lại tí nhé.',
        sloganTooLong: 'Câu hơi dài — gọn lại tí nhé.',
        alreadyPaired: 'Mình đã ghép với người khác rồi.',
        network: 'Mạng đang trục trặc. Mình thử lại nhé.',
      },
    },
    pairJoin: {
      kicker: 'có ai đó đang đợi…',
      title: 'Nhập mã\nngười ta gửi.',
      youFallback: 'bạn',
      partnerFallback: 'người ta',
      codeLabel: 'mã tám chữ',
      altOr: 'hoặc',
      scanTitle: 'Quét mã QR',
      scanSub: 'Khi hai đứa đang đứng cạnh nhau',
      help: 'Mã có dạng A1B2-C3D4 — tám chữ chia làm hai cụm. Người ta thấy mã ngay sau khi tạo lời mời.',
      cta: 'Ghép đôi',
      joining: 'Đang ghép…',
      remaining: 'Còn {{n}} chữ nữa thôi',
      ready: 'sẵn sàng vào nhà ♥',
    },
    pairWait: {
      kicker: 'gửi cho người ta',
      title: 'Mời {{partner}}\nvào nhà mình.',
      status: 'đang chờ ghép',
      youFallback: 'bạn',
      partnerFallback: 'người ta',
      codeLabel: 'mã của hai đứa',
      copyCode: 'Chép mã',
      copyLink: 'Chép link',
      copied: 'Đã chép',
      shareInvite: 'Chia sẻ lời mời',
      shareZalo: 'Zalo',
      shareOther: 'Khác',
      expiresHint: 'Hết hạn sau 24 giờ',
      privacyFootnote: 'Mã chỉ dùng được một lần, cho một người.',
      qrAltOr: 'hoặc',
      qrTitle: 'Quét mã QR khi đứng cạnh nhau',
      qrHint: 'Mở Memoura · chọn "Có mã rồi"',
      waitingFor: 'Đang chờ {{partner}}',
      waitingHeadline: 'Cứ để mở màn này nhé',
      waitingBody:
        'Khi {{partner}} nhập mã, Memoura sẽ mở cửa cho hai đứa.',
      benefitsTitle: 'Khi {{partner}} vào, hai đứa có',
      benefits: {
        moments: {
          title: 'Khoảnh khắc chung',
          body: 'Cùng đăng ảnh, ghi chú, vị trí — chỉ hai đứa thấy.',
        },
        letters: {
          title: 'Thư tay riêng tư',
          body: 'Viết một lá thư hôm nay, hẹn mở tuần sau, năm sau.',
        },
        dailyq: {
          title: 'Câu hỏi mỗi ngày',
          body: 'Một câu nhỏ để biết nhau hơn — không bắt buộc.',
        },
        recap: {
          title: 'Hồi tưởng tự động',
          body: 'Memoura ghép lại tháng, năm — như cuốn sổ nhỏ.',
        },
      },
      privacy: 'Khi người kia mở link, hai đứa sẽ tự động ghép lại.',
      shareMessage:
        'Vào Memoura cùng mình nhé ✨ Mở link: {{url}} (hoặc nhập mã {{code}} trong app)',
      signOutA11y: 'Quay lại màn hình đăng nhập',
      signOutTitle: 'Đăng xuất?',
      signOutBody: 'Bạn muốn đăng xuất khỏi Memoura? Chưa ghép đôi xong cũng không sao.',
      signOutConfirm: 'Đăng xuất',
    },
    personalize: {
      title: 'Em là ai?',
      subtitle: 'Tên gọi và một gương mặt',
      nickLabel: 'Tên gọi',
      nickPlaceholder: 'Tên của bạn',
      nickIcon: '✶',
      colorLabel: 'Chọn một sắc',
      previewPlaceholder: 'tên của bạn',
      cta: 'Tiếp',
      saving: 'Đang lưu…',
      avatarAdd: 'Thêm ảnh',
      avatarChange: 'Thay đổi ảnh',
      avatarUploading: 'Đang tải ảnh…',
      colorNames: {
        primary: 'Hồng đào',
        accent: 'Cam quýt',
        secondary: 'Mận chín',
        primaryDeep: 'Đồng',
        sunset: 'Hoàng hôn',
        mint: 'Bạc hà',
      },
      errors: {
        nameRequired: 'Mình muốn được gọi là gì nhỉ?',
        avatarFailed: 'Tải ảnh chưa được. Thử lại nhé.',
        network: 'Mạng đang trục trặc. Mình thử lại nhé.',
      },
    },
    done: {
      eyebrow: 'mọi thứ sẵn rồi',
      title: '{{names}},\nchào mừng về\nnhà.',
      titleSelfFallback: 'mình',
      titlePartnerFallback: 'người ấy',
      status: 'đã ghép đôi',
      sinceToday: 'từ hôm nay',
      sinceWithDate: 'từ {{date}}',
      kicker: 'cùng nhau giữ lại điều đáng giữ ♥',
      cta: 'Vào Memoura',
      finishing: 'Đang vào…',
      firstThings: {
        moment: { icon: '📷', title: 'khoảnh khắc đầu', sub: 'lưu ngay' },
        letter: { icon: '✉️', title: 'lá thư đầu', sub: 'viết tay' },
        question: { icon: '?', title: 'câu hỏi đầu', sub: 'hôm nay' },
      },
    },
    intro: {
      next: 'Tiếp',
      finish: 'Vào đây nào',
      slides: {
        moments: {
          accent: 'khoảnh khắc nhỏ',
          title: 'Giữ lại\nnhững ngày bên nhau',
          body: 'Những khoảnh khắc nhỏ — một cái nắm tay, một bữa sáng, một buổi chiều mưa — gom lại thành của riêng hai đứa mình.',
        },
        letters: {
          accent: 'thư viết tay',
          title: 'Viết thư\ncho nhau nghe',
          body: 'Có những điều khó nói thành lời — mình gửi em trong một lá thư. Có thể hẹn ngày đến, hoặc để dành cho ngày kỷ niệm.',
          letterSalutation: 'Gửi Minh,',
          letterSignoff: '— của mình',
        },
        daily: {
          accent: 'mỗi ngày một câu',
          title: 'Biết nhau hơn\ntừng ngày một',
          body: 'Mỗi sáng một câu hỏi nhỏ — để hai đứa mình vẫn hiểu nhau thêm một chút, kể cả những ngày bận nhất.',
          today: 'Hôm nay',
          question: 'Giấc mơ đẹp nhất của mình?',
          placeholder: 'Mình trả lời…',
          answeredBy: 'người ấy đã trả lời',
        },
      },
    },
  },
  pairing: {
    title: 'Ghép đôi',
    yourCode: 'Mã của mình',
    enterPartnerCode: 'Nhập mã của đối phương',
    share: 'Chia sẻ mã',
    paired: 'Đã ghép đôi với {{partner}}',
  },
  profile: {
    title: 'Mình',
    // Sprint 61 T338 — hero card copy
    hero: {
      usLabel: 'Đôi mình',
      soloLabel: 'Một mình',
      notPaired: 'Chưa ghép đôi',
      since: 'từ {{date}}',
      selfFallback: 'Mình',
      partnerFallback: 'người ấy',
    },
    // Sprint 61 T339 — stats row
    stats: {
      moments: 'Khoảnh khắc',
      letters: 'Thư tình',
      questions: 'Câu hỏi',
    },
    // Sprint 61 T340 — settings list. Labels mirror prototype
    // more-screens.jsx:7. Detail subkeys are used for rows where the right-
    // hand caption swaps based on state (notifications on/off, appearance
    // mode, subscription tier, app version).
    settingsSections: {
      infoLegal: 'Thông tin & Pháp lý',
      account: 'Tài khoản',
    },
    settingsList: {
      editProfile: 'Chỉnh sửa hồ sơ',
      editProfileDetail: 'Tên · ảnh',
      anniversaries: 'Kỷ niệm & ngày quan trọng',
      coupleName: 'Tên gọi của mình',
      inviteCode: 'Mã mời',
      notifications: 'Thông báo',
      appearance: 'Giao diện',
      memouraPlus: 'Memoura+',
      replayTour: 'Xem lại hướng dẫn',
      // Sprint 67 T458 — permanent archive of past recaps (12 months + 12
      // weeks). Replaced the temporary T452/T456 preview stubs.
      recapArchive: 'Lưu trữ recap',
      privacy: 'Chính sách bảo mật',
      terms: 'Điều khoản sử dụng',
      version: 'Phiên bản',
      signOut: 'Đăng xuất',
      deleteAccount: {
        label: 'Xóa tài khoản',
        detail: 'Xóa vĩnh viễn dữ liệu của bạn',
      },
      deleteAccountAlert: {
        title: 'Xóa tài khoản?',
        body: 'Tất cả khoảnh khắc, thư, ảnh của mình sẽ bị xóa vĩnh viễn. Hành động này KHÔNG thể hoàn tác.',
        cancel: 'Huỷ',
        confirm: 'Tiếp tục',
      },
      // T373 — notifications prompt. Only the `systemBlocked` alert remains:
      // when OS perm is denied, the row bounces to Settings because iOS/Android
      // don't let an app re-prompt for push after a denial. Granted-state flips
      // are silent now (no in-app confirm). Named `notificationsPrompt` to
      // avoid collision with the row label `notifications: 'Thông báo'` above.
      notificationsPrompt: {
        systemBlockedTitle: 'Thông báo đang bị chặn',
        systemBlockedBody: 'Thông báo đang bị chặn trong Cài đặt iOS. Mở Cài đặt để bật lại nhé.',
        systemBlockedAction: 'Mở Cài đặt',
      },
      detail: {
        on: 'Bật',
        off: 'Tắt',
        system: 'Theo hệ thống',
        free: 'Miễn phí',
        version: 'v{{version}}',
      },
      signOutAlert: {
        title: 'Đăng xuất?',
        body: 'Bạn sẽ cần đăng nhập lại để xem các khoảnh khắc của hai đứa.',
        cancel: 'Huỷ',
        confirm: 'Đăng xuất',
      },
    },
    // Sprint 61 T340 — invite-code bottom sheet opened from settings list.
    invite: {
      title: 'Mã mời của bạn',
      subtitle: 'Gửi mã này cho người ấy để cùng vào Memoura.',
      codeLabel: 'mã của bạn',
      shareCta: 'Chia sẻ',
      copyCta: 'Sao chép',
      copied: 'Đã sao chép ✓',
    },
    // Sprint 61 T348 — Delete Account confirmation sheet (App Store
    // 5.1.1(v) mandatory). Text-challenge word must match after trim,
    // case-sensitive — localized so VN users aren't hit with English-only
    // friction. DELETE matches the challenge word in en.ts.
    deleteAccount: {
      title: 'Xóa tài khoản vĩnh viễn',
      subtitle:
        'Tài khoản, khoảnh khắc, thư, ảnh và mọi kỷ niệm của mình sẽ bị xóa hoàn toàn khỏi Memoura. Không thể hoàn tác.',
      challenge: 'XÓA',
      inputLabel: 'Gõ "{{word}}" để xác nhận',
      placeholder: 'Gõ {{word}}',
      confirmCta: 'Xóa vĩnh viễn',
      confirming: 'Đang xóa…',
      cancel: 'Huỷ',
      errors: {
        network: 'Không xóa được tài khoản. Kiểm tra mạng rồi thử lại.',
      },
    },
    // Sprint 61 T355 — anniversary date-picker bottom sheet. Opens from
    // the "Kỷ niệm & ngày quan trọng" settings row. Single date, local
    // YYYY-MM-DD, max = today.
    anniversary: {
      title: 'Kỷ niệm của hai đứa',
      subtitle: 'Chọn ngày hai đứa mình bắt đầu — ngày sẽ hiện trên thẻ “Đôi mình”.',
      save: 'Lưu',
      saving: 'Đang lưu…',
      notSet: 'Chưa đặt',
      errors: {
        network: 'Có lỗi xảy ra. Kiểm tra mạng rồi thử lại.',
      },
    },
    // Sprint 61 T342 — edit couple-name bottom sheet. Opens from the
    // "Tên gọi của mình" settings row.
    coupleName: {
      title: 'Tên gọi của mình',
      subtitle: 'Đặt một cái tên chung cho hai đứa — có thể đổi bất cứ lúc nào.',
      label: 'Tên gọi',
      placeholder: 'Ví dụ: Minh & Linh',
      save: 'Lưu',
      saving: 'Đang lưu…',
      errors: {
        nameRequired: 'Nhập tên giúp mình nhé.',
        network: 'Có lỗi xảy ra. Kiểm tra mạng rồi thử lại.',
      },
    },
    // Sprint 61 T357+T358 — merged edit-identity bottom sheet (name + slogan).
    // Replaces coupleName above as the active sheet for the "Tên gọi của
    // mình" row; the coupleName keys stay in place so CoupleNameSheet.tsx
    // doesn't break until the legacy file is removed.
    editIdentity: {
      title: 'Tên gọi & slogan',
      subtitle: 'Đặt tên gọi chung và một câu slogan ngắn cho hai bạn.',
      fields: {
        name: {
          label: 'Tên gọi',
          placeholder: 'Ví dụ: Minh & Linh',
        },
        slogan: {
          label: 'Slogan (tuỳ chọn)',
          placeholder: 'Một câu ngắn cho hai bạn…',
        },
      },
      counter: '{{count}}/{{max}}',
      errors: {
        nameRequired: 'Chưa có tên gọi. Hãy điền một tên.',
        sloganTooLong: 'Slogan tối đa 80 ký tự.',
        saveFailed: 'Có lỗi xảy ra. Hãy thử lại.',
      },
      save: 'Lưu',
      saving: 'Đang lưu…',
    },
    // Sprint 61 T341 — edit-profile bottom sheet (name + avatar). Opens from
    // the hero self-avatar and the "Chỉnh sửa hồ sơ" settings row.
    editProfile: {
      title: 'Chỉnh sửa hồ sơ',
      subtitle: 'Cập nhật tên hiển thị và ảnh đại diện của mình.',
      nameLabel: 'Tên của mình',
      namePlaceholder: 'Ví dụ: Minh',
      avatarAdd: 'Thêm ảnh đại diện',
      avatarChange: 'Đổi ảnh',
      avatarUploading: 'Đang tải ảnh…',
      save: 'Lưu',
      saving: 'Đang lưu…',
      errors: {
        nameRequired: 'Nhập tên giúp mình nhé.',
        avatarFailed: 'Tải ảnh không thành công. Thử lại nha.',
        network: 'Có lỗi xảy ra. Kiểm tra mạng rồi thử lại.',
      },
    },
    // Sprint 61 T356 — Theme picker bottom sheet (Light / Dark / System).
    // Opened from the "Giao diện" settings row. `option.*` labels the three
    // Pressable rows inside the sheet; `current.*` is the detail string
    // shown on the settings row itself (identical wording, kept as a
    // sibling so future divergence stays easy).
    theme: {
      title: 'Giao diện',
      subtitle: 'Chọn cách ứng dụng hiển thị. "Theo hệ thống" sẽ đổi theo cài đặt thiết bị.',
      option: {
        light: 'Sáng',
        dark: 'Tối',
        system: 'Theo hệ thống',
      },
      current: {
        light: 'Sáng',
        dark: 'Tối',
        system: 'Theo hệ thống',
      },
    },
    palette: 'Bảng màu',
    mode: 'Chế độ',
    typeSystem: 'Kiểu chữ',
    density: 'Mật độ',
    language: 'Ngôn ngữ',
    signOut: 'Đăng xuất',
  },
  settings: {
    palette: { brand: 'Nhãn hiệu', evolve: 'Evolve' },
    mode: { system: 'Hệ thống', light: 'Sáng', dark: 'Tối' },
    type: { sans: 'Sans', serif: 'Sans + Serif', script: 'Sans + Script' },
    density: { airy: 'Thoáng', compact: 'Gọn' },
    language: { vi: 'Tiếng Việt', en: 'English' },
  },
  // Sprint 66 — Daily Q&A full screen (DailyQuestionsScreen).
  dailyQuestions: {
    title: 'Câu hỏi hôm nay',
    subtitle: 'Một câu mỗi ngày · cho hai đứa',
    streak: 'Chuỗi {{n}} ngày',
    streakZero: 'Bắt đầu một chuỗi',
    todayBadge: 'Hôm nay · {{date}}',
    questionCounter: 'Q · {{n}}',
    memouraAsks: 'Memoura hỏi · cho {{a}} & {{b}}',
    memouraAsksSolo: 'Memoura hỏi · cho {{a}}',
    yourAnswer: 'Câu trả lời của em',
    partnerLabel: '{{partner}} trả lời',
    partnerThinking: '{{partner}} đang suy nghĩ…',
    partnerThinkingHint: '{{partner}} chưa trả lời. Em cứ đi trước.',
    inputName: 'Em trả lời…',
    inputPlaceholder: 'Gõ gì đó cho {{partner}} — không cần đúng, chỉ cần thật.',
    inputPlaceholderSolo: 'Gõ gì đó thật lòng — không cần đúng, chỉ cần thật.',
    charsLeft: 'còn {{n}} ký tự',
    writingTip: '💡 Hãy nhớ lại một buổi chiều cụ thể — một mùi, một âm thanh.',
    send: 'Gửi',
    voice: 'Ghi âm',
    photo: 'Ảnh',
    hints: 'Gợi ý',
    partnerLockedNotYet: 'Chưa trả lời',
    partnerLockedPill: 'khoá',
    partnerLockedHint: 'Trả lời xong mình sẽ thấy câu của {{partner}}',
    partnerSkeleton: '{{partner}} chưa trả lời…',
    todayVibe: 'Vibe hôm nay',
    vibe: {
      coffee: '☕ cà phê',
      rain: '🌧 mưa nhẹ',
      missing: '💭 nhớ',
      trinh: '🎶 Trịnh',
      sun: '☀️ nắng chiều',
    },
    yesterdayTitle: 'Câu hôm qua',
    yesterdayBoth: 'Cả hai đã trả lời · chạm để xem lại',
    history: 'Những câu trước',
    errorLoad: 'Không tải được câu hỏi hôm nay. Kéo xuống để thử lại.',
    emptyTitle: 'Chưa có câu hỏi',
    emptyBody: 'Memoura đang chuẩn bị câu hỏi đầu tiên cho hai đứa. Quay lại sau nhé.',
    submitError: 'Không gửi được câu trả lời. Thử lại nhé.',
  },
  // Sprint 67 T452 — Editorial recap. Section keys for the cover only ship in
  // this sprint; T453 / T454 add nested keys for sections 01-09 + actions
  // on top of `recap.monthly.section.*`.
  recap: {
    monthly: {
      cover: {
        kicker: 'RECAP · {{period}}',
        // VI hero title is "Tháng {N}\ncủa mình" — line2 is fixed.
        titleLine1: 'Tháng {{n}}',
        titleLine2: 'của mình',
        coverKicker: 'Nhìn lại · {{days}} ngày',
        scrollHint: 'cuộn xuống',
        stat: {
          moments: 'khoảnh khắc',
          letters: 'thư tình',
          trips: 'chuyến đi',
        },
      },
      loading: 'Đang tải recap…',
      // Sprint 67 T453 — sections 01-04 keys.
      section: {
        byNumbers: {
          title: 'Bằng những con số',
          moments: 'khoảnh khắc',
          letters: 'thư tình',
          trips: 'chuyến đi',
          words: 'từ đã viết',
          daysStreak: 'ngày trả lời liền',
          questions: 'Daily Q · {{count}} câu hỏi',
        },
        heatmap: {
          title: 'Nhịp của tháng này',
          hint: 'Ngày nào mình cũng có gì đó để nói với nhau',
          legendLess: 'ít',
          legendMore: 'nhiều',
          busiestPrefix: 'ngày sôi nổi nhất',
        },
        topMoments: {
          title: '3 khoảnh khắc đọng lại',
          photos: '{{count}} ảnh',
          reactions: '{{count}} tim',
        },
        mood: {
          title: 'Tâm trạng qua ngày',
          placeholder: 'Tính năng Vibes đang trên đường về — khi nào bật, mình sẽ thấy 5 vùng tâm trạng phổ biến nhất tháng này.',
        },
        // Sprint 67 T454 — sections 05-09 + actions.
        places: {
          title: 'Nơi mình đã đến',
          countLabel: 'lần',
          caption: '{{count}} địa điểm tháng này',
          captionEmpty: 'Tháng này chưa lưu địa điểm nào',
          emptyTitle: 'Chưa có dấu chân nào',
          emptyBody: 'Khi mình thêm địa điểm cho khoảnh khắc, nơi đó sẽ xuất hiện ở đây.',
        },
        topQuestion: {
          title: 'Câu hỏi được nói nhiều nhất',
          meta: 'Mình đã hỏi nhau {{count}} lần trong tháng',
          emptyBody: 'Tháng này chưa có Daily Q nào — quay lại sau khi mình trả lời vài câu nhé.',
        },
        letterHighlight: {
          title: 'Một lá thư để giữ',
          kicker: 'Từ {{sender}} · {{date}}',
          cta: 'Đọc lại',
          emptyBody: 'Tháng này chưa có lá thư nào để chọn. Một lá thôi cũng đủ ấm cả tháng.',
        },
        firsts: {
          title: 'Lần đầu của mình',
          tagLabel: 'lần đầu',
          emptyBody: 'Chưa có lần đầu nào tháng này — gắn tag #lầnđầu cho moment để xuất hiện ở đây.',
        },
        closing: {
          kicker: 'Lời kết',
          titleWithPartner: 'Cảm ơn {{partner}}\nvì tháng này.',
          titleSolo: 'Cảm ơn\nvì tháng này.',
          body: 'Tháng đi qua nhưng mình vẫn còn nhau. Mong tháng tới mình sẽ có thêm nhiều buổi chiều nữa để ngồi cùng nhau, không vội, không gì cả.',
        },
      },
      actions: {
        shareLabel: 'Chia sẻ với {{partner}}',
        shareLabelSolo: 'Chia sẻ recap',
        saveBookLabel: '📔 Lưu vào Sổ',
        shareSuccessTitle: 'Đã sao chép link',
        shareSuccessBody: 'Gửi cho người ấy để cùng xem lại tháng này nhé.',
        shareErrorTitle: 'Không sao chép được',
        shareErrorBody: 'Có lỗi xảy ra. Thử lại sau nhé.',
        saveBookTitle: 'Sắp có ✨',
        saveBookBody: 'Sổ kỷ niệm đang được Memoura chăm chút — sẽ ra mắt sớm.',
      },
      empty: {
        title: 'Tháng yên ắng quá 🐶',
        body: 'Chưa có khoảnh khắc nào tháng này. Cùng tạo nhé!',
      },
      error: {
        title: 'Không tải được recap',
        body: 'Có lỗi xảy ra khi tải dữ liệu. Thử lại sau nhé.',
        retry: 'Thử lại',
      },
      // Sprint 67 D4 — toast surfaced when the requested month had no
      // moments / letters / Q&A and the screen walked back to the most
      // recent month with data.
      fallback: {
        title: 'Đã chuyển sang tháng có dữ liệu',
        body: '{{requested}} chưa có khoảnh khắc nào — mình hiện {{landed}} thay nhé.',
      },
      closeLabel: 'Đóng',
    },
    // Sprint 67 T460 — Stories composer labels (shared across monthly +
    // weekly Stories deck).
    stories: {
      coverScrollHint: 'chạm để xem tiếp',
      topMomentCta: 'Xem chi tiết',
      placesHeadline: 'Mình đã đến {{count}} nơi',
      placesCaption: '{{count}} địa điểm thời gian này',
      stat: {
        moments: 'KHOẢNH KHẮC',
        letters: 'THƯ TÌNH',
        photos: 'ẢNH ĐÃ LƯU',
        questions: 'DAILY Q',
        momentsSub: 'Mỗi tấm là một dấu mốc',
      },
      actions: {
        save: 'Lưu thành video 30 giây',
        saveSub: 'Sắp có — chia sẻ recap thành reel ngắn',
        shareSub: 'Sao chép link cho người ấy',
        detail: 'Xem chi tiết tất cả',
        kicker: 'Trước khi đi…',
        headline: 'Một tay mình muốn giữ',
        body: 'Lưu lại hoặc chia sẻ với người ấy. Nếu muốn xem chi tiết từng phần, mở scroll editorial bên dưới.',
        signoff: 'Hẹn recap kế tiếp 🐾',
      },
      // Sprint 67 D1 — Photo reel mosaic slide.
      photoReel: {
        headline: 'Nhìn lại một lần nữa',
        caption: 'Đang xem {{showing}} trong {{of}} ảnh',
      },
      // Sprint 67 D9 — LettersDeck stacked-cards slide labels
      // (replaces D8's lettersCollection vertical list).
      lettersDeck: {
        kicker: 'THƯ TÌNH · {{count}} lá',
        headline: 'Một chồng thư trong tháng',
        empty: 'Tháng này chưa có thư nào…',
      },
    },
    // Sprint 67 T456 — compact weekly editorial. 5 sections.
    weekly: {
      cover: {
        kicker: 'RECAP · {{period}}',
        titleLine1: 'Tuần này',
        coverKicker: 'Tổng kết tuần qua',
        scrollHint: 'cuộn xuống',
        stat: {
          moments: 'khoảnh khắc',
          letters: 'thư',
          questions: 'Daily Q',
        },
      },
      section: {
        byNumbers: {
          title: 'Bằng những con số',
          moments: 'khoảnh khắc',
          letters: 'thư',
          questions: 'Daily Q',
        },
        heatmap: {
          title: 'Nhịp tuần này',
          hint: 'Một tuần qua, từng ngày của hai đứa',
          busiestPrefix: 'ngày sôi nổi nhất tuần',
        },
        topMoment: {
          title: 'Khoảnh khắc của tuần',
          emptyBody: 'Tuần này chưa có khoảnh khắc nổi bật. Chụp một tấm để tuần sau có chuyện kể!',
        },
      },
      closing: {
        body: 'Một tuần nhỏ thôi, nhưng đủ ấm. Mong tuần sau mình có thêm vài chiều nữa để cùng nhau.',
      },
      loading: 'Đang tải recap…',
      empty: {
        title: 'Tuần này yên ắng quá 🐶',
        body: 'Tuần này hai đứa chưa có khoảnh khắc, thư hay Daily Q. Cùng nhau ghi lại gì đó nhé!',
      },
      error: {
        title: 'Không tải được recap',
        body: 'Có lỗi xảy ra khi tải dữ liệu. Thử lại sau nhé.',
        retry: 'Thử lại',
      },
      fallback: {
        title: 'Đã chuyển sang tuần có dữ liệu',
        body: '{{requested}} chưa có khoảnh khắc nào — mình hiện {{landed}} thay nhé.',
      },
      closeLabel: 'Đóng',
    },
  },
  // Sprint 67 T458 — Recap archive list reachable from Profile.
  recapArchive: {
    title: 'Lưu trữ recap',
    introBody: '12 tháng + 12 tuần gần nhất. Chạm vào để mở recap.',
    monthsTitle: 'Theo tháng',
    weeksTitle: 'Theo tuần',
    weekLabel: 'Tuần {{n}}',
  },
};

export default vi;
export type Resources = typeof vi;
