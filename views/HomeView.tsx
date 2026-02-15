
import React, { useState, useMemo } from 'react';
import { UserProfile, Meeting } from '../types';
import { CATEGORIES } from '../constants';
import AppLogo from '../components/AppLogo';

interface HomeViewProps {
  user: UserProfile | null;
  meetings: Meeting[];
  onSelectMeeting: (id: string) => void;
  onCreateClick: () => void;
}

type SortOrder = 'START_SOON' | 'NEWEST';

const HomeView: React.FC<HomeViewProps> = ({ user, meetings, onSelectMeeting, onCreateClick }) => {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortOrder, setSortOrder] = useState<SortOrder>('START_SOON');

  const filteredAndSortedMeetings = useMemo(() => {
    const now = new Date().getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    // 1. 카테고리 필터링 및 "모임 시간으로부터 하루가 지나지 않은 모임"만 추출
    let result = meetings.filter(m => {
      const meetingTime = new Date(m.date).getTime();
      const isActive = meetingTime + oneDayInMs >= now;
      const categoryMatch = selectedCategory === '전체' || m.category === selectedCategory;
      return isActive && categoryMatch;
    });

    // 2. 정렬 로직 적용
    result = [...result].sort((a, b) => {
      if (sortOrder === 'START_SOON') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      } else {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : parseInt(a.id.replace('meeting_', ''));
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : parseInt(b.id.replace('meeting_', ''));
        return timeB - timeA;
      }
    });

    return result;
  }, [meetings, selectedCategory, sortOrder]);

  return (
    <div className="flex flex-col gap-8 pt-6 px-6 pb-40 page-enter">
      {/* Welcome Message */}
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-tight">
            {user ? `${user.nickname}님, 반가워요!` : '안녕하세요!'} <br/> 
            <span className="text-[#2DD4BF]">오늘 어떤 즐거움을 찾을까요?</span>
          </h2>
        </div>
        <AppLogo size={56} animate className="-mt-1" />
      </header>

      {/* Category Tabs & Sort Toggles */}
      <div className="flex flex-col gap-5 sticky top-24 z-10 bg-[#F8FAFC]/95 backdrop-blur-md py-3 -mx-2 px-2">
        <section className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-[13px] font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#2DD4BF] text-white shadow-md'
                  : 'bg-white text-slate-500 border border-slate-100 hover:border-teal-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </section>

        <section className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {selectedCategory} 모임 ({filteredAndSortedMeetings.length})
          </h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSortOrder('START_SOON')}
              className={`text-[11px] font-bold flex items-center gap-1.5 transition-colors ${sortOrder === 'START_SOON' ? 'text-teal-600' : 'text-slate-400'}`}
            >
              시작순
            </button>
            <button 
              onClick={() => setSortOrder('NEWEST')}
              className={`text-[11px] font-bold flex items-center gap-1.5 transition-colors ${sortOrder === 'NEWEST' ? 'text-teal-600' : 'text-slate-400'}`}
            >
              최신순
            </button>
          </div>
        </section>
      </div>

      {/* Main List */}
      <section className="flex flex-col gap-6">
        {filteredAndSortedMeetings.map((meeting) => (
          <div 
            key={meeting.id}
            onClick={() => onSelectMeeting(meeting.id)}
            className="group bg-white rounded-[32px] border border-slate-100 card-shadow transition-all hover:-translate-y-1 cursor-pointer p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-600">
                {meeting.category}
              </span>
              {meeting.isCertifiedOnly && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-teal-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 5.052 3.823 9.21 8.684 9.815a.485.485 0 00.632-.423m0-15.62c4.02.582 7.59 3.085 9.155 6.521a12.01 12.01 0 01-3.155 11.205m-4.987-16.1L12 3m0 0l-.013.01c-.137.017-.273.036-.408.057" />
                  </svg>
                  인증전용
                </span>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <h4 className="font-bold text-lg leading-tight text-slate-800 group-hover:text-teal-500 transition-colors">
                {meeting.title}
              </h4>
              <div className="flex flex-wrap gap-2">
                {meeting.moodTags?.map(tag => (
                  <span key={tag} className="text-[11px] text-slate-400 font-medium">#{tag}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
               <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                  <div className="flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     {meeting.date.split(' ')[0]}
                  </div>
                  <div className="flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                     </svg>
                     {meeting.location?.split(' ')[1] || meeting.location}
                  </div>
               </div>
               <div className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-600">
                  {meeting.currentParticipants} / {meeting.capacity} 명
               </div>
            </div>
          </div>
        ))}
        
        {filteredAndSortedMeetings.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/50 flex flex-col gap-3 items-center justify-center">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
             </div>
             <p className="text-slate-400 text-sm font-medium">
               참여 가능한 모임이 아직 없어요.<br/>먼저 모임을 제안해 볼까요?
             </p>
          </div>
        )}
      </section>

      {/* Floating Action Button */}
      <button
        onClick={onCreateClick}
        className="fixed bottom-32 right-6 h-14 px-6 bg-[#2DD4BF] text-white rounded-full shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 z-20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span className="text-sm font-bold">모임 제안</span>
      </button>
    </div>
  );
};

export default HomeView;
