
import React, { useState } from 'react';

interface ProfileSetupViewProps {
  onComplete: (data: any) => void;
}

const ProfileSetupView: React.FC<ProfileSetupViewProps> = ({ onComplete }) => {
  const [nickname, setNickname] = useState('');
  const [location, setLocation] = useState('서울');

  return (
    <div className="flex flex-col gap-10 mt-4">
      <div className="text-center">
        <h2 className="serif-font text-2xl font-bold text-slate-800">거의 다 됐습니다</h2>
        <p className="text-slate-400 mt-2 text-xs font-light leading-relaxed">비혼뒤맑음에서 사용할 멋진 프로필을 완성해 주세요.</p>
      </div>

      <div className="flex flex-col gap-8">
        <section className="bg-white p-8 rounded-[40px] border border-teal-50 shadow-sm flex flex-col gap-6">
           <div>
              <label className="block text-[10px] font-black text-teal-600 mb-3 uppercase tracking-widest">Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="어떻게 불러드릴까요?"
                className="w-full px-6 py-4 rounded-3xl bg-teal-50/20 border border-transparent text-slate-800 focus:outline-none focus:bg-white focus:border-teal-200 transition-all text-sm font-medium"
              />
           </div>

           <div>
              <label className="block text-[10px] font-black text-teal-600 mb-3 uppercase tracking-widest">Your Location</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['서울', '경기', '인천', '부산', '대구', '기타'].map(loc => (
                  <button
                    key={loc}
                    onClick={() => setLocation(loc)}
                    className={`px-5 py-2.5 rounded-2xl text-[11px] font-bold transition-all shrink-0 ${location === loc ? 'bg-teal-500 text-white shadow-md' : 'bg-teal-50 text-teal-600 border border-teal-100'}`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
           </div>
        </section>

        <button
          onClick={() => onComplete({ nickname, location, interests: [] })}
          disabled={!nickname.trim()}
          className={`w-full py-5 rounded-[28px] font-bold text-sm tracking-widest transition-all ${!nickname.trim() ? 'bg-slate-100 text-slate-300' : 'bg-teal-500 text-white shadow-xl shadow-teal-500/20 active:scale-95'}`}
        >
          설정 완료
        </button>
      </div>
    </div>
  );
};

export default ProfileSetupView;
