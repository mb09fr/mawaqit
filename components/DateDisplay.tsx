
import React from 'react';

interface DateDisplayProps {
  hijri: string;
  gregorian: string;
  currentTime: Date;
}

const DateDisplay: React.FC<DateDisplayProps> = ({ hijri, gregorian, currentTime }) => {
  // Parse Hijri date to get day and month
  // Format: "DD Month YYYY هـ"
  const hijriParts = hijri.split(' ');
  const hijriDay = parseInt(hijriParts[0]);
  const hijriMonth = hijriParts[1];

  const isFriday = currentTime.getDay() === 5;
  const isMonday = currentTime.getDay() === 1;
  const isThursday = currentTime.getDay() === 4;
  const isWhiteDay = [13, 14, 15].includes(hijriDay);

  // Month detection (Arabic)
  const isRamadan = hijriMonth === 'رمضان';
  const isShawwal = hijriMonth === 'شوال';
  const isDhuAlHijjah = hijriMonth === 'ذو الحجة';

  const isEidAlFitr = isShawwal && hijriDay === 1;
  const isEidAlAdha = isDhuAlHijjah && hijriDay === 10;

  const tags = [];

  if (isEidAlFitr) {
    tags.push({ label: 'عيد الفطر', color: '!text-emerald-400 !bg-emerald-400/10 !border-emerald-400/20' });
  } else if (isEidAlAdha) {
    tags.push({ label: 'عيد الأضحى', color: '!text-emerald-400 !bg-emerald-400/10 !border-emerald-400/20' });
  }

  if (isRamadan) {
    tags.push({ label: 'رمضان كريم', color: '!text-amber-400 !bg-amber-400/10 !border-amber-400/20' });
  }

  if (isFriday) {
    tags.push({ label: 'يوم الجمعة', color: '!text-amber-400 !bg-amber-400/10 !border-amber-400/20' });
  }

  if (isWhiteDay) {
    tags.push({ label: 'الأيام البيض', color: '!text-purple-400 !bg-purple-400/10 !border-purple-400/20' });
  } else if ((isMonday || isThursday) && !isRamadan && !isEidAlFitr && !isEidAlAdha) {
    // Only show voluntary fasting if not Ramadan or Eid
    tags.push({ label: 'صيام التطوع', color: '!text-purple-400 !bg-purple-400/10 !border-purple-400/20' });
  }

  return (
    <div className="flex flex-col items-center gap-0.5 mb-8">
      <div className="flex flex-col items-center gap-0.5 opacity-80">
        <div className="text-sm text-blue-100 font-medium tracking-wide">
          {gregorian}
        </div>
        <div className="text-xs font-light text-gray-400" dir="rtl">
          {hijri}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className={`text-[10px] px-2 py-0.5 rounded-full border ${tag.color} backdrop-blur-sm`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default DateDisplay;