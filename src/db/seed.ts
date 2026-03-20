import pg from "pg";
import bcrypt from "bcryptjs";
import { config } from "../config/index.js";

async function seed() {
  const client = new pg.Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  });

  await client.connect();

  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await client.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ["Admin", "admin@imedtech.mn", hashedPassword, "admin"]
    );
    console.log("Admin user: admin@imedtech.mn / admin123");

    const products = [
      {
        brand: "LYNMOU",
        name: "LYNMOU VC-1600 Ходоод, бүдүүн гэдэсний уян дуран",
        name_en: "LYNMOU VC-1600 Gastrointestinal Endoscope",
        description: '32" 4K дэлгэцтэй, хэрэглэхэд хялбар мэдрэгчтэй дэлгэцтэй уян дуран систем.',
        description_en: 'Endoscope system with 32" 4K display and user-friendly touchscreen.',
        image: "/content/media/lynmou-vc-1600.jpg",
        is_featured: true,
        is_new: true,
        features: [
          { feature: '32" 4K дэлгэцтэй', feature_en: '32" 4K display' },
          { feature: "Хэрэглэхэд хялбар мэдрэгчтэй дэлгэцтэй", feature_en: "User-friendly touchscreen" },
          { feature: "Дүрсний горим: HLI, SVI, TCI, DHI", feature_en: "Imaging modes: HLI, SVI, TCI, DHI" },
          { feature: "One-touch холболттой", feature_en: "One-touch connection (no additional cable needed)" },
          { feature: "Multi-Led ламптай (50,000 цаг)", feature_en: "Multi-LED lamp (50,000 hours lifespan)" },
        ],
        specifications: [
          { spec_key: "imagingModes", spec_value: "HLI, SVI, TCI, DHI" },
          { spec_key: "display", spec_value: '32" 4K' },
          { spec_key: "ledLifespan", spec_value: "50,000 цаг" },
          { spec_key: "colorEnhancement", spec_value: "Улаан, Цэнхэр, Сатураци, ±15 түвшин" },
        ],
      },
      {
        brand: "LYNMOU",
        name: "LYNMOU VC-880 Ходоод, бүдүүн гэдэсний уян дуран",
        name_en: "LYNMOU VC-880 Gastrointestinal Endoscope",
        description: '27" FULL HD дэлгэцтэй уян дуран систем.',
        description_en: 'Endoscope system with 27" FULL HD display and user-friendly touchscreen.',
        image: "/content/media/lynmou-vc-880.jpg",
        is_featured: true,
        is_new: false,
        features: [
          { feature: '27" FULL HD дэлгэцтэй', feature_en: '27" FULL HD display' },
          { feature: "Хэрэглэхэд хялбар мэдрэгчтэй дэлгэцтэй", feature_en: "User-friendly touchscreen" },
          { feature: "Дүрсний горим: HLI, SVI, TCI", feature_en: "Imaging modes: HLI, SVI, TCI" },
        ],
        specifications: [
          { spec_key: "imagingModes", spec_value: "HLI, SVI, TCI" },
          { spec_key: "display", spec_value: '27" FULL HD' },
          { spec_key: "ledLifespan", spec_value: "50,000 цаг" },
        ],
      },
      {
        brand: "DRGEM",
        name: "GXR-52SD дижитал рентген",
        name_en: "GXR-52SD Digital Radiography",
        description: "52kW гаралтын хүч, 40-150kV хоолойн хүчдэл, 17x17 утасгүй детектор.",
        description_en: "52kW output power, 40-150kV tube voltage, 17x17 wireless detector.",
        image: "/content/media/drgem-gxr52sd.jpg",
        is_featured: true,
        is_new: true,
        features: [
          { feature: "52kW гаралтын хүч", feature_en: "52kW output power" },
          { feature: "40-150kV хоолойн хүчдэл", feature_en: "40-150kV tube voltage" },
          { feature: "17x17 утасгүй детектор", feature_en: "17x17 wireless detector" },
          { feature: "AI уушгины оношилгоо", feature_en: "AI chest findings" },
        ],
        specifications: [
          { spec_key: "outputPower", spec_value: "52kW" },
          { spec_key: "tubeVoltage", spec_value: "40-150kV" },
          { spec_key: "tubeCurrent", spec_value: "10-640mA" },
          { spec_key: "detector", spec_value: "17x17 wireless" },
        ],
      },
      {
        brand: "CHISON",
        name: "CHISON XBit 90 хэт авиан",
        name_en: "CHISON XBit 90 Ultrasound",
        description: "AI ажлын урсгалтай, 4D дүрслэлтэй премиум хэт авиан.",
        description_en: "Premium ultrasound system with AI workflow, 4D imaging.",
        image: "/content/media/chison-xbit90.jpg",
        is_featured: false,
        is_new: true,
        features: [
          { feature: "AI ажлын урсгал", feature_en: "AI Workflow" },
          { feature: "4D дүрслэл", feature_en: "4D Imaging" },
          { feature: "Дэвшилтэт probe preset", feature_en: "Advanced Probes" },
          { feature: "Зүү тодруулах функц", feature_en: "Needle Enhancement" },
        ],
        specifications: [
          { spec_key: "imaging", spec_value: "4D" },
          { spec_key: "ai", spec_value: "Yes" },
          { spec_key: "workflow", spec_value: "Smart" },
        ],
      },
      {
        brand: "COMEN",
        name: "COMEN K18 Pro өвчтөний монитор",
        name_en: "COMEN K18 Pro Patient Monitor",
        description: "18 инчийн олон үзүүлэлттэй өвчтөний монитор.",
        description_en: "18-inch multi-parameter patient monitor with ECG, NIBP, SpO2, CO2.",
        image: "/content/media/comen-k18pro.jpg",
        is_featured: false,
        is_new: false,
        features: [
          { feature: '18" дэлгэц', feature_en: '18" Display' },
          { feature: "Олон үзүүлэлт", feature_en: "Multi-parameter" },
          { feature: "Дэвшилтэт дохиолол", feature_en: "Advanced Alarms" },
          { feature: "Төв станцын холболт", feature_en: "Central Station" },
        ],
        specifications: [
          { spec_key: "display", spec_value: '18"' },
          { spec_key: "parameters", spec_value: "ECG, NIBP, SpO2, CO2" },
          { spec_key: "alarms", spec_value: "Advanced" },
        ],
      },
    ];

    for (const p of products) {
      const result = await client.query(
        `INSERT INTO products (brand, name, name_en, description, description_en, image, brochure, is_featured, is_new)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [p.brand, p.name, p.name_en, p.description, p.description_en, p.image, "", p.is_featured, p.is_new]
      );

      const productId = result.rows[0].id;

      for (let i = 0; i < p.features.length; i++) {
        await client.query(
          "INSERT INTO product_features (product_id, feature, feature_en, sort_order) VALUES ($1, $2, $3, $4)",
          [productId, p.features[i].feature, p.features[i].feature_en, i]
        );
      }

      for (let i = 0; i < p.specifications.length; i++) {
        await client.query(
          "INSERT INTO product_specifications (product_id, spec_key, spec_value, sort_order) VALUES ($1, $2, $3, $4)",
          [productId, p.specifications[i].spec_key, p.specifications[i].spec_value, i]
        );
      }

      console.log(`  + ${p.name_en}`);
    }

    const infoCheck = await client.query("SELECT COUNT(*) FROM information_items");
    if (Number(infoCheck.rows[0].count) === 0) {
      const sampleImages = ["/on-onii/on1.jpg", "/on-onii/on2.jpg", "/on-onii/on3.jpg"];
      for (let i = 0; i < sampleImages.length; i++) {
        await client.query(
          `INSERT INTO information_items (image, title_mn, title_en, description_mn, description_en, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            sampleImages[i],
            `Он оны зураг ${i + 1}`,
            `Yearly photo ${i + 1}`,
            "Зураг болон товч мэдээлэл.",
            "Photo with brief highlight.",
            i,
          ]
        );
      }
      console.log(`  + ${sampleImages.length} information items`);
    }

    console.log(`\nSeed complete! ${products.length} products.`);
  } finally {
    await client.end();
  }
}

seed().catch(console.error);
