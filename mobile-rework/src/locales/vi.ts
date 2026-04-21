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
    dailyQTitle: 'Hỏi nhau hôm nay',
    dailyQ: 'Nếu được tặng nhau một buổi chiều bất kỳ, mình muốn cùng làm gì nhỉ?',
    dailyQCta: 'Trả lời',
    dailyQPartnerPending: '{{partner}} đã trả lời · chạm để mở khoá',
    dailyQStreak: 'Chuỗi {{days}} ngày',
    latestFrom: '{{partner}} vừa thêm một khoảnh khắc',
    latestAgo: '{{n}} giờ trước',
    recapTitle: 'Tháng {{month}} của mình',
    recapSub: '{{moments}} khoảnh khắc · {{letters}} lá thư · {{trips}} chuyến đi',
    recapCta: 'Xem lại',
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
      photoboothSub: 'Sắp ra mắt 💝',
      permission: {
        cameraDenied: 'Memoura cần quyền truy cập máy ảnh để chụp khoảnh khắc. Mở Cài đặt để bật nhé.',
        libraryDenied: 'Memoura cần quyền truy cập thư viện ảnh để thêm khoảnh khắc. Mở Cài đặt để bật nhé.',
        openSettings: 'Mở Cài đặt',
        cancel: 'Để sau',
      },
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
      close: 'Đóng',
      photosLabel: 'Ảnh',
      photosCount: '{{count}}/10',
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
    },
    // T378 — global upload toast. T391 (Sprint 62): serial upload gate means
    // progress is X/Y, not count-only. `uploading` expects {{current}} + {{total}};
    // `failed` expects {{failed}} + {{total}}; `done` keeps {{count}}=successCount.
    uploadToast: {
      uploading: 'Đang tải lên {{current}}/{{total}} ảnh',
      done: 'Đã tải {{count}} ảnh',
      failed: 'Không tải được {{failed}}/{{total}} ảnh',
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
        title: 'Cho ai nữa?',
        subtitle: 'Memoura chỉ có hai người',
        create: {
          title: 'Tạo lời mời',
          subtitle: 'Cho người ta một mã 8 ký tự',
        },
        join: {
          title: 'Có mã rồi',
          subtitle: 'Nhập mã từ người ta',
        },
        lockNote: 'Mỗi người chỉ ghép với một người. Không có bạn bè, không có theo dõi.',
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
    personalize: {
      title: 'Một chút riêng tư',
      subtitle: 'Tên gọi · màu · ngày bắt đầu',
      nickLabel: 'Tên gọi của mình',
      nickPlaceholder: 'Mình',
      nickIcon: '✶',
      colorLabel: 'Màu của hai đứa',
      dateLabel: 'Ngày hai đứa bắt đầu',
      datePlaceholder: '14.02.2023',
      dateIcon: '📅',
      previewSince: 'từ',
      previewPlaceholder: 'Mình',
      previewPartner: 'người ấy',
      cta: 'Gần xong rồi',
      saving: 'Đang lưu…',
      avatarAdd: 'Thêm ảnh',
      avatarChange: 'Thay đổi ảnh',
      avatarUploading: 'Đang tải ảnh…',
      errors: {
        nameRequired: 'Mình muốn được gọi là gì nhỉ?',
        dateRequired: 'Hãy chọn ngày bắt đầu',
        dateInvalid: 'Ngày chưa đúng định dạng (DD.MM.YYYY)',
        avatarFailed: 'Tải ảnh chưa được. Thử lại nhé.',
        network: 'Mạng đang trục trặc. Mình thử lại nhé.',
      },
    },
    permissions: {
      title: 'Một vài quyền',
      subtitle: 'Mình có thể đổi sau này',
      cta: 'Xong rồi, vào nhà',
      skip: 'Bỏ qua',
      allow: 'Cho phép',
      granted: 'Đã bật',
      denied: 'Đã tắt',
      notif: {
        title: 'Thông báo nhẹ nhàng',
        body: 'Một câu hỏi sáng, một lời chúc tối. Không spam.',
      },
      photos: {
        title: 'Thư viện ảnh',
        body: 'Để mình chọn ảnh khi thêm khoảnh khắc.',
      },
    },
    done: {
      eyebrow: 'mọi thứ sẵn rồi',
      title: '{{names}},\nchào mừng về nhà.',
      titleSelfFallback: 'mình',
      titlePartnerFallback: 'người ấy',
      body: 'Đây sẽ là nơi giữ lại những gì hai đứa không muốn quên. Bắt đầu bằng khoảnh khắc đầu tiên nhé.',
      cta: 'Vào Memoura',
      finishing: 'Đang vào…',
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
};

export default vi;
export type Resources = typeof vi;
