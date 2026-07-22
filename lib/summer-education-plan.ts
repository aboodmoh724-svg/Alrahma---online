import { prisma } from "@/lib/prisma";

export type EducationPlanCategory = "KIBAR" | "SIGHAR";

export type EducationPlanTopic = {
  id: string;
  category: EducationPlanCategory;
  weekNumber: number;
  title: string;
  details: string;
};

const SUMMER_EDUCATION_PLAN_KEY = "summer_education_plan_topics";

export const DEFAULT_SUMMER_EDUCATION_TOPICS: EducationPlanTopic[] = [
  // خطة الصغار
  { id: "s1", category: "SIGHAR", weekNumber: 1, title: "أركان الإسلام والإيمان المبسطة", details: "تعريف بحب الله ورسوله وأركان الإسلام الخمسة" },
  { id: "s2", category: "SIGHAR", weekNumber: 2, title: "الآداب الإسلامية اليومية", details: "آداب الطعام، الشراب، ودخول المنزل والخروج منه" },
  { id: "s3", category: "SIGHAR", weekNumber: 3, title: "بر الوالدين وحسن الخلق", details: "طاعة الوالدين، الاحترام، والرفق بالأصدقاء" },
  { id: "s4", category: "SIGHAR", weekNumber: 4, title: "قصص الأنبياء والقدوة الحسنة", details: "مواقف من حياة النبي محمد ﷺ وأخلاقه" },

  // خطة الكبار
  { id: "k1", category: "KIBAR", weekNumber: 1, title: "التوحيد والعقيدة الصحيحة", details: "معرفة الله تعالى ومراقبة الله في السر والعلن" },
  { id: "k2", category: "KIBAR", weekNumber: 2, title: "فقه الصلاة والطهارة", details: "أحكام الطهارة، الوضوء، والخشوع في الصلاة" },
  { id: "k3", category: "KIBAR", weekNumber: 3, title: "الآداب والأخلاق السامية", details: "حفظ اللسان، التواضع، والابتعاد عن الغيبة" },
  { id: "k4", category: "KIBAR", weekNumber: 4, title: "السيرة النبوية والمواقف العظيمة", details: "دروس وعبر من السيرة النبوية الشريفة" },
];

export async function getSummerEducationTopics(): Promise<EducationPlanTopic[]> {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: SUMMER_EDUCATION_PLAN_KEY },
      select: { value: true },
    });

    if (!setting || !setting.value || !Array.isArray(setting.value)) {
      return DEFAULT_SUMMER_EDUCATION_TOPICS;
    }

    return setting.value as EducationPlanTopic[];
  } catch (error) {
    console.error("GET SUMMER EDUCATION TOPICS ERROR =>", error);
    return DEFAULT_SUMMER_EDUCATION_TOPICS;
  }
}

export async function saveSummerEducationTopics(topics: EducationPlanTopic[]) {
  return prisma.appSetting.upsert({
    where: { key: SUMMER_EDUCATION_PLAN_KEY },
    create: {
      key: SUMMER_EDUCATION_PLAN_KEY,
      value: topics,
    },
    update: {
      value: topics,
    },
  });
}
