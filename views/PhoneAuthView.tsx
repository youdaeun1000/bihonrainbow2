
import React, { useState } from 'react';

interface PhoneAuthViewProps {
  onComplete: (data: { phone: string; age: number }) => void;
  onCancel: () => void;
}

const PhoneAuthView: React.FC<PhoneAuthViewProps> = ({ onComplete, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [checks, setChecks] = useState({
    over35: false,
    unmarried: false,
    isBihon: false
  });

  const allChecked = checks.over35 && checks.unmarried && checks.isBihon;

  const handleAuth = () => {
    if (phoneNumber.length < 10) {
      setError('올바른 휴대폰 번호를 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // 휴대폰 인증 시뮬레이션
    setTimeout(() => {
      setIsLoading(false);
      // 실제 구현 시에는 인증된 연령 데이터를 넘겨야 함
      onComplete({ phone: phoneNumber, age: 38 }); 
    }, 1500);
  };

  const toggleCheck = (key: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const CheckItem = ({ id, label, checked }: { id: keyof typeof checks, label: string, checked: boolean }) => (
    <label 
      onClick={() => toggleCheck(id)}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
        checked ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-100 hover:border-teal-100'
      }`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
        checked ? 'bg-teal-500 border-teal-500 shadow-sm' : 'bg-white border-slate-200'
      }`}>
        {checked && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-[13px] font-bold ${checked ? 'text-teal-700' : 'text-slate-500'}`}>
        {label}
      </span>
    </label>
  );

  return (
    <div className="flex flex-col gap-10 mt-8 px-6 pb-20 page-enter">
      <div className="text-center">
        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-teal-100">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
           </svg>
        </div>
        <h2 className="serif-font text-2xl font-bold text-slate-800 tracking-tight">본인확인이 필요합니다</h2>
        <p className="text-slate-400 mt-3 text-xs font-light leading-relaxed">
          35세 이상 비혼 커뮤니티 유지를 위해<br/>최초 1회 본인 인증과 자격 확인을 진행합니다.
        </p>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-teal-50 shadow-lg shadow-teal-900/5 flex flex-col gap-8">
        {/* Eligibility Section */}
        <section className="flex flex-col gap-3">
          <label className="text-[10px] font-bold text-teal-600 uppercase tracking-widest px-2 mb-1">Eligibility Declaration</label>
          <CheckItem id="over35" label="본인은 35세 이상입니다 (필수)" checked={checks.over35} />
          <CheckItem id="unmarried" label="본인은 현재 법적 미혼 상태입니다 (필수)" checked={checks.unmarried} />
          <CheckItem id="isBihon" label="본인은 비혼주의자입니다 (필수)" checked={checks.isBihon} />
        </section>

        {/* Phone Input Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-teal-600 uppercase tracking-widest px-2">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="01012345678"
              className="w-full px-6 py-4 rounded-3xl bg-slate-50 border border-transparent text-slate-800 focus:outline-none focus:bg-white focus:border-teal-200 transition-all text-sm font-medium tracking-widest"
            />
          </div>
          
          {error && <p className="text-rose-500 text-[10px] font-bold text-center">{error}</p>}

          <button
            onClick={handleAuth}
            disabled={isLoading || phoneNumber.length < 10 || !allChecked}
            className={`w-full py-5 rounded-[28px] font-bold text-sm tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${
              (isLoading || phoneNumber.length < 10 || !allChecked) 
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
              : 'bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/20 active:scale-[0.97]'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : '본인확인 및 인증번호 발송'}
          </button>
        </div>

        <button
          onClick={onCancel}
          className="text-center text-slate-300 text-[10px] font-bold tracking-widest uppercase hover:text-slate-400 transition-colors"
        >
          홈으로 돌아가기
        </button>
      </div>

      <div className="px-4 py-6 bg-teal-50/30 rounded-3xl border border-teal-50 flex items-start gap-4">
        <span className="text-xl mt-1">🛡️</span>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-slate-600 font-bold">허위 정보 입력 시 활동 제한</p>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            비혼뒤맑음은 멤버 간의 신뢰를 가장 중요하게 생각합니다.<br/>
            자격 요건에 맞지 않는 정보로 가입할 경우 무통보 강제 탈퇴 처리될 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhoneAuthView;
