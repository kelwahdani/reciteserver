import prisma from "../../utils/prisma";




// 2️⃣ Get getAllWeek
const getAllWeek = async (userId: string) => {
  // ✅ সব week days আনুন
  const week = await prisma.weekDay.findMany({
    where: { userId },
    orderBy: { order: 'asc' }, // optional, যাতে Sunday-Saturday 순মে আসে
  });

  // ✅ active week days count
  const weekCount = await prisma.weekDay.count({
    where: { userId, active: true },
  });

  // ✅ result return করা
  return {
    week,       // সব week days
    activeCount: weekCount, // কতটি active
  };
};






// 4️⃣ Update challenge
const updateWeekChallenge = async (id: string) => {
  // প্রথমে বর্তমান মান fetch করা
  const weekDay = await prisma.weekDay.findUnique({ where: { id } });
  if (!weekDay) throw new Error("WeekDay not found");

  // toggle করা
  const updatedWeekDay = await prisma.weekDay.update({
    where: { id },
    data: { active: !weekDay.active },
  });

  return updatedWeekDay;
};



const updateWeekChallengeAutomactive = async (userId: string) => {
  // 1️⃣ আজকের দিন বের করা (English weekday)
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  // 2️⃣ User এর সব WeekDay fetch
  const weekDays = await prisma.weekDay.findMany({
    where: { userId },
  });

  if (!weekDays || weekDays.length === 0) {
    throw new Error("No WeekDay found for this user");
  }

    
  // 3️⃣ আজকের দিন update করা
  const updatedWeekDay = await prisma.weekDay.updateMany({
    where: { userId, name: todayName },
    data: { status: "COMPLETE",active:true }, // enum: COMPLETE
  });

  return updatedWeekDay; // এখানে কত record update হয়েছে তা দিবে
};


// const cleanChallenge = async () => {
//   // 1️⃣ User-এর সব WeekDay update করে status PENDING set করা
  
//   const updatedWeekDays = await prisma.weekDay.updateMany({

//     data: { status: "PENDING" }, // enum: PENDING
//   });

//   return updatedWeekDays; // কতগুলো record update হয়েছে তা দিবে
// };

const cleanChallenge = async () => {
  // 1️⃣ প্রতিটি ইউজারের WeekDay fetch করা
  const users = await prisma.user.findMany({
    include: { WeekDay: true },
  });

  for (const user of users) {
    // COMPLETE WeekDay count
    const completeCount = user.WeekDay.filter(wd => wd.status === 'COMPLETE').length;

    // activeCount update করার logic
    const addCount = completeCount > 5 ? 100 : completeCount;

    await prisma.user.update({
      where: { id: user.id },
      data: { activeCount: (user.activeCount || 0) + addCount },
    });
  }

  // 2️⃣ সব WeekDay কে PENDING করা
  const updatedWeekDays = await prisma.weekDay.updateMany({
    data: { status: "PENDING",active:false },
  });

  return updatedWeekDays; // কতগুলো record update হয়েছে তা দিবে
};








export const WeekChallengeService = {

  updateWeekChallenge,

  getAllWeek,
  updateWeekChallengeAutomactive,
  cleanChallenge
};
