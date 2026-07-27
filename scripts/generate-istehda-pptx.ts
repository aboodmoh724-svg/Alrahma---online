import pptxgen from "pptxgenjs";
import path from "path";
import fs from "fs";

async function generatePPTX() {
  console.log("🚀 Generating PowerPoint Presentation Deck for Istehda Quran Platform...");
  const pptx = new pptxgen();

  pptx.layout = "LAYOUT_16x9";
  pptx.author = "عبد الرحمن محمد دهبية";
  pptx.company = "برنامج البناء المنهجي - دفعة العطاء";
  pptx.title = "عرض تجريبي - منصة استهداء لتعليم القرآن الكريم";

  // Color Palette Constants
  const EMERALD = "1E4D3B";
  const GOLD = "C59B27";
  const LIGHT_BG = "F9F9FB";
  const WHITE = "FFFFFF";
  const DARK_TEXT = "1C2D31";
  const MUTED_TEXT = "4A5568";
  const SOFT_CARD_BG = "F4F6F5";

  // Shape aliases from pptx.shapes
  const RECT = (pptx as any).shapes.RECTANGLE;
  const ROUND_RECT = (pptx as any).shapes.ROUNDED_RECTANGLE;
  const OVAL = (pptx as any).shapes.OVAL;

  // Shared Header Helper
  const addHeader = (slide: pptxgen.Slide, titleText: string, subtitleText: string) => {
    // Top banner fill
    slide.addShape(RECT, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 1.1,
      fill: { color: EMERALD },
    });

    // Gold accent line bottom of header
    slide.addShape(RECT, {
      x: 0,
      y: 1.07,
      w: 13.33,
      h: 0.05,
      fill: { color: GOLD },
    });

    // Main Slide Header Title
    slide.addText(titleText, {
      x: 0.5,
      y: 0.15,
      w: 12.33,
      h: 0.5,
      fontSize: 22,
      fontFace: "Cairo",
      bold: true,
      color: GOLD,
      align: "right",
      rtl: true,
    });

    // Subtitle / Tagline
    slide.addText(subtitleText, {
      x: 0.5,
      y: 0.62,
      w: 12.33,
      h: 0.35,
      fontSize: 13,
      fontFace: "Tajawal",
      color: "E2E8F0",
      align: "right",
      rtl: true,
    });
  };

  // ════════════════════════════════════════════════════════════
  // SLIDE 1: Cover Slide (غلاف العرض التقديمي)
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };

    // Outer Frame Border (Islamic Gold & Emerald Frame)
    slide.addShape(RECT, {
      x: 0.4,
      y: 0.4,
      w: 12.53,
      h: 6.7,
      fill: { color: WHITE },
      line: { color: GOLD, width: 2 },
    });

    slide.addShape(RECT, {
      x: 0.55,
      y: 0.55,
      w: 12.23,
      h: 6.4,
      fill: { color: "FAFAFC" },
      line: { color: EMERALD, width: 1 },
    });

    // Header Hero Banner Box
    slide.addShape(ROUND_RECT, {
      x: 1.0,
      y: 0.9,
      w: 11.33,
      h: 2.7,
      rectRadius: 0.15,
      fill: { color: EMERALD },
      line: { color: GOLD, width: 2 },
    });

    // Platform Name Pill Badge
    slide.addText("✨ منصة استهداء لتعليم القرآن الكريم ✨", {
      x: 1.5,
      y: 1.15,
      w: 10.33,
      h: 0.4,
      fontSize: 15,
      fontFace: "Tajawal",
      bold: true,
      color: GOLD,
      align: "center",
      rtl: true,
    });

    // Main Presentation Title
    slide.addText("مشروع منصة قرآنية تعليمية متكاملة", {
      x: 1.2,
      y: 1.6,
      w: 10.93,
      h: 0.8,
      fontSize: 30,
      fontFace: "Cairo",
      bold: true,
      color: WHITE,
      align: "center",
      rtl: true,
    });

    // Subtitle
    slide.addText("تجمع بين الإتقان في الحفظ والتلاوة ومجالس الاستهداء بالقرآن الكريم", {
      x: 1.2,
      y: 2.45,
      w: 10.93,
      h: 0.5,
      fontSize: 17,
      fontFace: "Tajawal",
      color: "F2E8D5",
      align: "center",
      rtl: true,
    });

    // Student Info Card
    slide.addShape(ROUND_RECT, {
      x: 2.2,
      y: 3.9,
      w: 8.93,
      h: 1.5,
      rectRadius: 0.12,
      fill: { color: WHITE },
      line: { color: GOLD, width: 1.5 },
      shadow: { type: "outer", color: "000000", opacity: 0.08, blur: 8, offset: 4 },
    });

    slide.addText("👤 إعداد الطالب الباحث:", {
      x: 2.4,
      y: 4.05,
      w: 8.53,
      h: 0.35,
      fontSize: 14,
      fontFace: "Tajawal",
      bold: true,
      color: GOLD,
      align: "center",
      rtl: true,
    });

    slide.addText("عبد الرحمن محمد دهبية", {
      x: 2.4,
      y: 4.4,
      w: 8.53,
      h: 0.5,
      fontSize: 22,
      fontFace: "Cairo",
      bold: true,
      color: EMERALD,
      align: "center",
      rtl: true,
    });

    slide.addText("الرقم الأكاديمي: 30484377", {
      x: 2.4,
      y: 4.9,
      w: 8.53,
      h: 0.35,
      fontSize: 13,
      fontFace: "Tajawal",
      color: MUTED_TEXT,
      align: "center",
      rtl: true,
    });

    // Academic Footer
    slide.addShape(ROUND_RECT, {
      x: 1.5,
      y: 5.75,
      w: 10.33,
      h: 0.7,
      rectRadius: 0.1,
      fill: { color: EMERALD },
      line: { color: GOLD, width: 1 },
    });

    slide.addText("🏛️ برنامج البناء المنهجي – دفعة العطاء | إسطنبول، تركيا | 2026م", {
      x: 1.5,
      y: 5.85,
      w: 10.33,
      h: 0.5,
      fontSize: 14,
      fontFace: "Tajawal",
      bold: true,
      color: GOLD,
      align: "center",
      rtl: true,
    });
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 2: Executive Summary (ملخص المشروع)
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };
    addHeader(slide, "ملخص المشروع — الرؤية والأهداف والثمرات", "دراسة شاملة لربط حفظ القرآن بالتزكية والمعايشة العملية");

    const cardsData = [
      {
        icon: "⚠️",
        title: "المشكلة",
        color: "9B2C2C",
        bgColor: "FFF5F5",
        text: "أغلب المنصات القرآنية إما تهتم بالحفظ والتجويد وتُهمل الجوانب التربوية والتزكوية، أو العكس تهتم بالبرامج التربوية وتُهمل حفظ القرآن وإتقانه. وكلا الأمرين مهم لا يستغنى أحد عن الآخر.",
      },
      {
        icon: "⭐",
        title: "الأهمية",
        color: GOLD,
        bgColor: "FEFCBF",
        text: "الأمة تمر بمحطات صعبة، وعليها السير وفق منهج النبوة (دار الأرقم): أخذ القرآن والعمل به. المشروع يرجع لهذا المنهج عبر دمج الإتقان مع مجالس الاستهداء والمعايشة العملية.",
      },
      {
        icon: "💡",
        title: "الوسيلة",
        color: EMERALD,
        bgColor: "E6FFFA",
        text: "منصة إلكترونية (موقع) تضم مسارات تعليمية متنوعة، مع دمج الذكاء الاصطناعي وإنشاء محتوى بصري عبر الموشن جرافيك وفيديوهات الذكاء الاصطناعي لتوسيع الأثر.",
      },
    ];

    cardsData.forEach((c, idx) => {
      const cardX = 0.6 + idx * 4.1;
      slide.addShape(ROUND_RECT, {
        x: cardX,
        y: 1.3,
        w: 3.83,
        h: 3.7,
        rectRadius: 0.12,
        fill: { color: WHITE },
        line: { color: c.color, width: 1.5 },
        shadow: { type: "outer", color: "000000", opacity: 0.06, blur: 6, offset: 3 },
      });

      slide.addShape(ROUND_RECT, {
        x: cardX + 0.3,
        y: 1.5,
        w: 3.23,
        h: 0.55,
        rectRadius: 0.08,
        fill: { color: EMERALD },
      });

      slide.addText(`${c.icon} ${c.title}`, {
        x: cardX + 0.3,
        y: 1.55,
        w: 3.23,
        h: 0.45,
        fontSize: 16,
        fontFace: "Cairo",
        bold: true,
        color: GOLD,
        align: "center",
        rtl: true,
      });

      slide.addText(c.text, {
        x: cardX + 0.25,
        y: 2.2,
        w: 3.33,
        h: 2.6,
        fontSize: 12.5,
        fontFace: "Tajawal",
        color: DARK_TEXT,
        align: "right",
        rtl: true,
        lineSpacing: 20,
      });
    });

    slide.addShape(ROUND_RECT, {
      x: 0.6,
      y: 5.2,
      w: 12.13,
      h: 1.9,
      rectRadius: 0.12,
      fill: { color: EMERALD },
      line: { color: GOLD, width: 1.5 },
    });

    slide.addText("🌿 الثمرات المتوقعة للمشروع", {
      x: 0.8,
      y: 5.3,
      w: 11.73,
      h: 0.35,
      fontSize: 15,
      fontFace: "Cairo",
      bold: true,
      color: GOLD,
      align: "right",
      rtl: true,
    });

    slide.addText(
      "📌 ثمرات أساسية: تعلم القرآن الكريم وإتقانه • إقامة مجالس الاستهداء بالقرآن الدائمة • التزكية بالقرآن والعمل به • المعايشة العملية للقرآن في الحياة اليومية.\n" +
      "📌 ثمرات جانبية: بناء صحبة قرآنية صالحة • التواصل المستمر مع أولياء الأمور • تغيير ثقافة المجتمع نحو القرآن كمنهاج حياة • إشغال وقت الشباب بالنافع وإبعادهم عن التفاهة.",
      {
        x: 0.8,
        y: 5.7,
        w: 11.73,
        h: 1.25,
        fontSize: 12,
        fontFace: "Tajawal",
        color: WHITE,
        align: "right",
        rtl: true,
        lineSpacing: 20,
      }
    );
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 3: Project Motivation (أسباب اختيار الثغر والمشروع)
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };
    addHeader(slide, "أسباب اختيار الثغر والمشروع — دوافع الانطلاق", "الركائز الذاتية والواقعية والموارد المتاحة للمشروع");

    const blocks = [
      {
        title: "1️⃣ الأسباب الذاتية والخبرة الميدانية",
        color: EMERALD,
        items: [
          "التواجد في حلقات القرآن الكريم وتحفيظه منذ الصغر.",
          "المشاركة والمساهمة المستمرة في المخيمات القرآنية الصيفية.",
          "تجربة عمل ميدانية ناجحة في مدينة أفيون (قرآن، تربية، وتواصل).",
          "الحصول على إجازات في القرآن الكريم والمتون العلمية.",
        ],
      },
      {
        title: "2️⃣ الأسباب الواقعية والضرورة الملحة",
        color: GOLD,
        items: [
          "ضيق الأنشطة الحضورية يضطر الكثيرين للجلوس في المنازل.",
          "طبيعة العمل والدراسة في تركيا وأوروبا لا تسمح بالدوام التقليدي.",
          "التعليم الإلكتروني أصبح واقعاً ملموساً وضرورة معاصرة.",
          "دمج الذكاء الاصطناعي يفتح أفقاً كبيراً لتطوير العملية التربوية.",
        ],
      },
      {
        title: "3️⃣ الموارد والفرص المتاحة",
        color: EMERALD,
        items: [
          "توفر الوقت الكافي لإدارة المشروع والإشراف التام عليه.",
          "الجاهزية التقنية وخبرة دمج أدوات الذكاء الاصطناعي.",
          "شبكة علاقات واسعة مع معلمين، مصممين، ومستشارين تربويين.",
          "توفر الدعم المالي المبدئي للانطلاق المباشر.",
        ],
      },
    ];

    blocks.forEach((b, idx) => {
      const blockX = 0.6 + idx * 4.1;
      slide.addShape(ROUND_RECT, {
        x: blockX,
        y: 1.3,
        w: 3.83,
        h: 5.8,
        rectRadius: 0.12,
        fill: { color: WHITE },
        line: { color: b.color, width: 1.5 },
        shadow: { type: "outer", color: "000000", opacity: 0.05, blur: 6, offset: 3 },
      });

      slide.addShape(ROUND_RECT, {
        x: blockX + 0.2,
        y: 1.5,
        w: 3.43,
        h: 0.65,
        rectRadius: 0.08,
        fill: { color: EMERALD },
        line: { color: GOLD, width: 1 },
      });

      slide.addText(b.title, {
        x: blockX + 0.2,
        y: 1.55,
        w: 3.43,
        h: 0.55,
        fontSize: 13.5,
        fontFace: "Cairo",
        bold: true,
        color: GOLD,
        align: "center",
        rtl: true,
      });

      const bulletsText = b.items.map((item) => `• ${item}`).join("\n\n");
      slide.addText(bulletsText, {
        x: blockX + 0.3,
        y: 2.35,
        w: 3.23,
        h: 4.5,
        fontSize: 12,
        fontFace: "Tajawal",
        color: DARK_TEXT,
        align: "right",
        rtl: true,
        lineSpacing: 18,
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 4: Platform System & Roadmap (التعريف ونظامه وخارطة الطريق)
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };
    addHeader(slide, "التعريف بالمشروع ونظامه وخارطة الطريق", "الرؤية التنفيذية ومراحل النمو والتوسع المستقبلي");

    // Definition Box (Top Right)
    slide.addShape(ROUND_RECT, {
      x: 6.8,
      y: 1.3,
      w: 5.93,
      h: 2.2,
      rectRadius: 0.12,
      fill: { color: WHITE },
      line: { color: EMERALD, width: 1.5 },
      shadow: { type: "outer", color: "000000", opacity: 0.05, blur: 5, offset: 2 },
    });

    slide.addText("📖 التعريف بالمشروع", {
      x: 7.0,
      y: 1.45,
      w: 5.53,
      h: 0.35,
      fontSize: 15,
      fontFace: "Cairo",
      bold: true,
      color: EMERALD,
      align: "right",
      rtl: true,
    });

    slide.addText(
      "منصة قرآنية تعليمية متكاملة تجمع بين الإتقان في التلاوة والحفظ، ومجالس الاستهداء بالقرآن، والتزكية به، والعمل به، لجعل القرآن مشروع حياة لدى شباب الجيل الصاعد.",
      {
        x: 7.0,
        y: 1.85,
        w: 5.53,
        h: 1.5,
        fontSize: 12.5,
        fontFace: "Tajawal",
        color: DARK_TEXT,
        align: "right",
        rtl: true,
        lineSpacing: 18,
      }
    );

    // Goals Box (Top Left)
    slide.addShape(ROUND_RECT, {
      x: 0.6,
      y: 1.3,
      w: 5.93,
      h: 2.2,
      rectRadius: 0.12,
      fill: { color: WHITE },
      line: { color: GOLD, width: 1.5 },
      shadow: { type: "outer", color: "000000", opacity: 0.05, blur: 5, offset: 2 },
    });

    slide.addText("🎯 الأهداف الاستراتيجية", {
      x: 0.8,
      y: 1.45,
      w: 5.53,
      h: 0.35,
      fontSize: 15,
      fontFace: "Cairo",
      bold: true,
      color: GOLD,
      align: "right",
      rtl: true,
    });

    slide.addText(
      "• الوصول لشريحة واسعة من الشباب في تركيا وأوروبا والعالم العربي.\n" +
      "• خلق بيئة قرآنية إلكترونية جاذبة ومحفزة على الاستمرار.\n" +
      "• تطوير وتطوير المحتوى القرآني عبر الإعلام الرقمي المبتكر.\n" +
      "• بناء أجيال معايشة للقرآن تنطلق من الفهم إلى العمل والتطبيق.",
      {
        x: 0.8,
        y: 1.85,
        w: 5.53,
        h: 1.5,
        fontSize: 12,
        fontFace: "Tajawal",
        color: DARK_TEXT,
        align: "right",
        rtl: true,
        lineSpacing: 16,
      }
    );

    // Timeline Container Box (Bottom)
    slide.addShape(ROUND_RECT, {
      x: 0.6,
      y: 3.7,
      w: 12.13,
      h: 3.4,
      rectRadius: 0.12,
      fill: { color: EMERALD },
      line: { color: GOLD, width: 1.5 },
    });

    slide.addText("🗺️ خارطة الطريق ومراحل النمو والتنفيذ (Roadmap Timeline)", {
      x: 0.8,
      y: 3.85,
      w: 11.73,
      h: 0.35,
      fontSize: 15,
      fontFace: "Cairo",
      bold: true,
      color: GOLD,
      align: "right",
      rtl: true,
    });

    // 5 Stages Horizontal Cards (RTL Order)
    const stages = [
      { num: "1", label: "التحضير", time: "أسبوعين - شهر", desc: "تطوير المنصة، دمج الذكاء الاصطناعي، وبناء الفريق." },
      { num: "2", label: "التجريبي", time: "شهر (50 طالباً)", desc: "إطلاق تجريبي قياسي واختبار جودة الأداء." },
      { num: "3", label: "الإطلاق الأوسع", time: "شهر (1,000 طالب)", desc: "كثافة إعلامية وحملات جذب مستهدفة." },
      { num: "4", label: "التوسع", time: "شهرين (5,000 طالب)", desc: "توسيع القاعدة الجماهيرية والمسارات." },
      { num: "5", label: "التطوير المستمر", time: "مرحلة مستمرة", desc: "إضافة مجالس حفظ السنة والسيرة النبوية." },
    ];

    stages.forEach((st, idx) => {
      const stageX = 11.5 - idx * 2.35; // RTL layout starting right to left
      slide.addShape(ROUND_RECT, {
        x: stageX - 1.1,
        y: 4.3,
        w: 2.2,
        h: 2.6,
        rectRadius: 0.08,
        fill: { color: WHITE },
        line: { color: GOLD, width: 1 },
      });

      slide.addShape(OVAL, {
        x: stageX - 0.3,
        y: 4.45,
        w: 0.6,
        h: 0.6,
        fill: { color: GOLD },
      });

      slide.addText(st.num, {
        x: stageX - 0.3,
        y: 4.45,
        w: 0.6,
        h: 0.6,
        fontSize: 15,
        fontFace: "Cairo",
        bold: true,
        color: EMERALD,
        align: "center",
      });

      slide.addText(st.label, {
        x: stageX - 1.05,
        y: 5.1,
        w: 2.1,
        h: 0.35,
        fontSize: 12.5,
        fontFace: "Cairo",
        bold: true,
        color: EMERALD,
        align: "center",
        rtl: true,
      });

      slide.addText(st.time, {
        x: stageX - 1.05,
        y: 5.45,
        w: 2.1,
        h: 0.3,
        fontSize: 10.5,
        fontFace: "Tajawal",
        bold: true,
        color: GOLD,
        align: "center",
        rtl: true,
      });

      slide.addText(st.desc, {
        x: stageX - 1.05,
        y: 5.75,
        w: 2.1,
        h: 1.0,
        fontSize: 10,
        fontFace: "Tajawal",
        color: DARK_TEXT,
        align: "center",
        rtl: true,
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 5: Challenges & Solutions (التحديات وطرق التعامل معها)
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };
    addHeader(slide, "التحديات وطرق التعامل معها — خطة الاستدامة", "حلول منهجية وعملية لمواجهة تحديات التشغيل والمنافسة");

    const challengePairs = [
      {
        cTitle: "⚠️ التحدي 1: التزام المعلمين وجودة الأداء",
        cDesc: "صعوبة ضبط أداء وتفرغ المعلمين والالتزام بالخطة التربوية المحددة.",
        sTitle: "🛡️ الحل الإجرائي",
        sDesc: "التدريب المنهجي الدوري، التأهيل المستمر، توفير الاستقرار المالي والمكافآت المجزية لإبقاء الكفاءات.",
      },
      {
        cTitle: "⚠️ التحدي 2: منافسة المنصات والتشتت",
        cDesc: "كثرة المشتتات وسطحية المحتوى الرقمي المتداول بين الجيل الصاعد.",
        sTitle: "🛡️ الحل الإجرائي",
        sDesc: "صناعة إعلام بصري وموشن جرافيك مبتكر وفيديوهات ذكاء اصطناعي تتناسب مع تطلعات الشباب لمزاحمة الباطل.",
      },
      {
        cTitle: "⚠️ التحدي 3: الاستدامة المالية والتكاليف",
        cDesc: "تأمين ميزانية التشغيل وتغطية تكاليف الخوادم والرواتب والتسويق.",
        sTitle: "🛡️ الحل الإجرائي",
        sDesc: "تحصيل رسوم ميسرة تناسب مقدرة الطلاب لتغطية الكلفة، مع منح مجانية واستقطاب ممولين وداعمين.",
      },
    ];

    challengePairs.forEach((pair, idx) => {
      const rowY = 1.3 + idx * 1.95;

      // Left Box (Solution Card)
      slide.addShape(ROUND_RECT, {
        x: 0.6,
        y: rowY,
        w: 5.8,
        h: 1.75,
        rectRadius: 0.1,
        fill: { color: WHITE },
        line: { color: EMERALD, width: 1.5 },
        shadow: { type: "outer", color: "000000", opacity: 0.05, blur: 4, offset: 2 },
      });

      slide.addText(pair.sTitle, {
        x: 0.8,
        y: rowY + 0.15,
        w: 5.4,
        h: 0.35,
        fontSize: 13.5,
        fontFace: "Cairo",
        bold: true,
        color: EMERALD,
        align: "right",
        rtl: true,
      });

      slide.addText(pair.sDesc, {
        x: 0.8,
        y: rowY + 0.55,
        w: 5.4,
        h: 1.05,
        fontSize: 12,
        fontFace: "Tajawal",
        color: DARK_TEXT,
        align: "right",
        rtl: true,
        lineSpacing: 18,
      });

      // Arrow Divider Badge (Center)
      slide.addShape(ROUND_RECT, {
        x: 6.46,
        y: rowY + 0.6,
        w: 0.4,
        h: 0.55,
        rectRadius: 0.05,
        fill: { color: GOLD },
      });

      slide.addText("➔", {
        x: 6.46,
        y: rowY + 0.6,
        w: 0.4,
        h: 0.55,
        fontSize: 14,
        color: EMERALD,
        bold: true,
        align: "center",
      });

      // Right Box (Challenge Card)
      slide.addShape(ROUND_RECT, {
        x: 6.93,
        y: rowY,
        w: 5.8,
        h: 1.75,
        rectRadius: 0.1,
        fill: { color: "FFFDF5" },
        line: { color: GOLD, width: 1.5 },
        shadow: { type: "outer", color: "000000", opacity: 0.05, blur: 4, offset: 2 },
      });

      slide.addText(pair.cTitle, {
        x: 7.13,
        y: rowY + 0.15,
        w: 5.4,
        h: 0.35,
        fontSize: 13.5,
        fontFace: "Cairo",
        bold: true,
        color: GOLD,
        align: "right",
        rtl: true,
      });

      slide.addText(pair.cDesc, {
        x: 7.13,
        y: rowY + 0.55,
        w: 5.4,
        h: 1.05,
        fontSize: 12,
        fontFace: "Tajawal",
        color: DARK_TEXT,
        align: "right",
        rtl: true,
        lineSpacing: 18,
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 6: Website Mockup & Budget (معاينة البوابة والملخص المالي)
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };
    addHeader(slide, "معاينة البوابة الرقمية والملخص المالي التأسيسي", "التحقق الميداني من جاهزية النظام والتقديرات المباشرة");

    // Right Card: Live UI Preview Mockup Card
    slide.addShape(ROUND_RECT, {
      x: 6.8,
      y: 1.3,
      w: 5.93,
      h: 5.8,
      rectRadius: 0.12,
      fill: { color: WHITE },
      line: { color: EMERALD, width: 1.5 },
      shadow: { type: "outer", color: "000000", opacity: 0.06, blur: 6, offset: 3 },
    });

    slide.addShape(ROUND_RECT, {
      x: 7.0,
      y: 1.45,
      w: 5.53,
      h: 0.55,
      rectRadius: 0.08,
      fill: { color: EMERALD },
    });

    slide.addText("💻 معاينة واجهة المنصة الرقمية العاملة", {
      x: 7.0,
      y: 1.5,
      w: 5.53,
      h: 0.45,
      fontSize: 14,
      fontFace: "Cairo",
      bold: true,
      color: GOLD,
      align: "center",
      rtl: true,
    });

    const mockupItems = [
      { label: "📊 لوحة متابعة إنجاز الحفظ والمراجعة", val: "متابعة يومية دقيقة" },
      { label: "📈 نسبة تقدم الطالب والتقييم السلوكي", val: "سجل أداء متكامل 100%" },
      { label: "🎥 بث حلقة Zoom التفاعلية المباشرة", val: "ربط متكامل ومباشر" },
      { label: "💬 نظام التواصل المباشر مع أولياء الأمور", val: "تقارير واتساب فورية" },
    ];

    mockupItems.forEach((m, idx) => {
      const mY = 2.15 + idx * 1.15;
      slide.addShape(ROUND_RECT, {
        x: 7.1,
        y: mY,
        w: 5.33,
        h: 0.95,
        rectRadius: 0.08,
        fill: { color: SOFT_CARD_BG },
        line: { color: GOLD, width: 1 },
      });

      slide.addText(m.label, {
        x: 7.25,
        y: mY + 0.1,
        w: 5.03,
        h: 0.35,
        fontSize: 12.5,
        fontFace: "Cairo",
        bold: true,
        color: EMERALD,
        align: "right",
        rtl: true,
      });

      slide.addText(m.val, {
        x: 7.25,
        y: mY + 0.45,
        w: 5.03,
        h: 0.35,
        fontSize: 11,
        fontFace: "Tajawal",
        color: MUTED_TEXT,
        align: "right",
        rtl: true,
      });
    });

    // Left Card: Financial Budget Card
    slide.addShape(ROUND_RECT, {
      x: 0.6,
      y: 1.3,
      w: 5.93,
      h: 5.8,
      rectRadius: 0.12,
      fill: { color: WHITE },
      line: { color: GOLD, width: 1.5 },
      shadow: { type: "outer", color: "000000", opacity: 0.06, blur: 6, offset: 3 },
    });

    slide.addShape(ROUND_RECT, {
      x: 0.8,
      y: 1.45,
      w: 5.53,
      h: 0.55,
      rectRadius: 0.08,
      fill: { color: EMERALD },
    });

    slide.addText("💰 الملخص المالي التأسيسي (فترة 4 أشهر)", {
      x: 0.8,
      y: 1.5,
      w: 5.53,
      h: 0.45,
      fontSize: 14,
      fontFace: "Cairo",
      bold: true,
      color: GOLD,
      align: "center",
      rtl: true,
    });

    const budgetItems = [
      {
        title: "الميزانية التشغيلية المطلوبة للانطلاق",
        amount: "$2,000 – $2,300",
        color: EMERALD,
        bgColor: "F0FDF4",
        desc: "تغطي تطوير الخوادم، برمجيات المنصة، تراخيص Zoom، التسويق المبدئي ومكافآت الكادر.",
      },
      {
        title: "المبلغ المتوفر حالياً (دعم مبدئي)",
        amount: "$1,000 – $1,300",
        color: GOLD,
        bgColor: "FEFCBF",
        desc: "تم تأمينه كدعم أولي لبدء الأعمال التأسيسية والتشغيل التجريبي.",
      },
      {
        title: "المبلغ المتبقي للانطلاق المباشر",
        amount: "$800 – $1,000",
        color: "C53030",
        bgColor: "FFF5F5",
        desc: "المبلغ المطلوب لتغطية كامل الخطة التشغيلية وتحقيق الانطلاق التام للمرحلة الأولى.",
      },
    ];

    budgetItems.forEach((b, idx) => {
      const bY = 2.15 + idx * 1.55;
      slide.addShape(ROUND_RECT, {
        x: 0.8,
        y: bY,
        w: 5.53,
        h: 1.4,
        rectRadius: 0.08,
        fill: { color: b.bgColor },
        line: { color: b.color, width: 1.5 },
      });

      slide.addText(b.title, {
        x: 0.95,
        y: bY + 0.1,
        w: 3.5,
        h: 0.35,
        fontSize: 12,
        fontFace: "Cairo",
        bold: true,
        color: DARK_TEXT,
        align: "right",
        rtl: true,
      });

      slide.addText(b.amount, {
        x: 4.4,
        y: bY + 0.08,
        w: 1.8,
        h: 0.4,
        fontSize: 14,
        fontFace: "Cairo",
        bold: true,
        color: b.color,
        align: "center",
      });

      slide.addText(b.desc, {
        x: 0.95,
        y: bY + 0.5,
        w: 5.23,
        h: 0.8,
        fontSize: 10.5,
        fontFace: "Tajawal",
        color: MUTED_TEXT,
        align: "right",
        rtl: true,
        lineSpacing: 15,
      });
    });
  }

  // ════════════════════════════════════════════════════════════
  // SLIDE 7: Conclusion Slide (الخاتمة)
  // ════════════════════════════════════════════════════════════
  {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };

    // Outer Border Frame
    slide.addShape(RECT, {
      x: 0.4,
      y: 0.4,
      w: 12.53,
      h: 6.7,
      fill: { color: WHITE },
      line: { color: GOLD, width: 2 },
    });

    slide.addShape(RECT, {
      x: 0.55,
      y: 0.55,
      w: 12.23,
      h: 6.4,
      fill: { color: "FAFAFC" },
      line: { color: EMERALD, width: 1 },
    });

    // Top Header Badge
    slide.addShape(ROUND_RECT, {
      x: 3.66,
      y: 0.8,
      w: 6.0,
      h: 0.6,
      rectRadius: 0.1,
      fill: { color: EMERALD },
      line: { color: GOLD, width: 1 },
    });

    slide.addText("🌿 الخاتمة والتطلع للمستقبل 🌿", {
      x: 3.66,
      y: 0.85,
      w: 6.0,
      h: 0.5,
      fontSize: 16,
      fontFace: "Cairo",
      bold: true,
      color: GOLD,
      align: "center",
      rtl: true,
    });

    // Central Large Hollow Card with Islamic Frame Quote
    slide.addShape(ROUND_RECT, {
      x: 1.2,
      y: 1.6,
      w: 10.93,
      h: 3.8,
      rectRadius: 0.15,
      fill: { color: WHITE },
      line: { color: GOLD, width: 2 },
      shadow: { type: "outer", color: "000000", opacity: 0.08, blur: 10, offset: 4 },
    });

    slide.addShape(ROUND_RECT, {
      x: 1.35,
      y: 1.75,
      w: 10.63,
      h: 3.5,
      rectRadius: 0.12,
      fill: { color: "FAFAF8" },
      line: { color: EMERALD, width: 1 },
    });

    slide.addText("«كلمة ختامية»", {
      x: 1.5,
      y: 1.95,
      w: 10.33,
      h: 0.4,
      fontSize: 16,
      fontFace: "Cairo",
      bold: true,
      color: GOLD,
      align: "center",
      rtl: true,
    });

    const quoteText =
      "\"نسأل الله تعالى أن تكون هذه المنصة القرآنية خطوة مباركة ولبنة عملية صادقة في مسار الإصلاح. " +
      "إننا على يقين تام بأن هذا المشروع ليس مجرد نهاية مطاف أكاديمي، بل هو نواة حقيقية وانطلاقة لمشاريع كبرى؛ " +
      "متى ما قُدّر لها أن تُقام على أسس صحيحة ومتينة، لنبتغي بها وجه الله تعالى وخدمة كتابه العظيم.\"";

    slide.addText(quoteText, {
      x: 1.6,
      y: 2.45,
      w: 10.13,
      h: 2.6,
      fontSize: 16,
      fontFace: "Amiri",
      bold: true,
      color: EMERALD,
      align: "center",
      rtl: true,
      lineSpacing: 28,
    });

    // Researcher & Program Footer Card
    slide.addShape(ROUND_RECT, {
      x: 1.5,
      y: 5.65,
      w: 10.33,
      h: 0.8,
      rectRadius: 0.1,
      fill: { color: EMERALD },
      line: { color: GOLD, width: 1 },
    });

    slide.addText(
      "👤 إعداد الطالب: عبد الرحمن محمد دهبية (الرقم الأكاديمي: 30484377)\n" +
      "🏛️ برنامج البناء المنهجي - دفعة العطاء | إسطنبول، تركيا | 2026م",
      {
        x: 1.5,
        y: 5.72,
        w: 10.33,
        h: 0.65,
        fontSize: 12.5,
        fontFace: "Tajawal",
        bold: true,
        color: GOLD,
        align: "center",
        rtl: true,
        lineSpacing: 16,
      }
    );
  }

  // Save PPTX File
  const outputDir = path.join(process.cwd(), "public", "downloads");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "Istehda_Presentation_Deck.pptx");
  await pptx.writeFile({ fileName: outputPath });
  console.log(`✅ PowerPoint file generated successfully at: ${outputPath}`);
}

generatePPTX().catch((err) => {
  console.error("❌ Error generating PPTX:", err);
  process.exit(1);
});
