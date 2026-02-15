
import React, { useMemo, useState, useEffect } from 'react';
import { UserProfile, Meeting, UserParticipation } from '../types';
import { db, doc, getDoc } from '../firebase';

interface MyPageViewProps {
  user: UserProfile | null;
  participations: UserParticipation[];
  allMeetings: Meeting[];
  onToggleVisibility: (meetingId: string) => void;
  onLogout: () => void;
  onWithdrawal: () => Promise<void>;
  onUpdateProfile: (data: { nickname: string; bio: string; interests: string[] }) => Promise<void>;
  onSelectMeeting: (meetingId: string) => void;
  onUnblockUser: (targetUserId: string) => Promise<void>;
}

interface BlockedUser {
  id: string;
  nickname: string;
}

const MyPageView: React.FC<MyPageViewProps> = ({ 
  user, 
  participations, 
  allMeetings, 
  onLogout, 
  onWithdrawal,
  onUpdateProfile,
  onSelectMeeting,
  onUnblockUser
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState(user?.nickname || '');
  const [isSaving, setIsSaving] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [showBlockedList, setShowBlockedList] = useState(false);

  useEffect(() => {
    if (showBlockedList && user?.blockedUserIds && user.blockedUserIds.length > 0) {
      const fetchBlockedUsers = async () => {
        setIsLoadingBlocks(true);
        try {
          const promises = user.blockedUserIds.map(async (id) => {
            const docSnap = await getDoc(doc(db, 'users', id));
            return { id, nickname: docSnap.exists() ? docSnap.data().nickname : '알 수 없는 사용자' };
          });
          const results = await Promise.all(promises);
          setBlockedUsers(results);
        } catch (error) {
          console.error("Failed to fetch blocked users:", error);
        } finally {
          setIsLoadingBlocks(false);
        }
      };
      fetchBlockedUsers();
    } else if (!showBlockedList) {
      setBlockedUsers([]);
    }
  }, [showBlockedList, user?.blockedUserIds]);

  const { upcomingMeetings, pastMeetings } = useMemo(() => {
    const now = new Date().getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    const joined = participations
      .map(p => {
        const meeting = allMeetings.find(m => m.id === p.meetingId);
        if (!meeting) return null;
        return { ...meeting, isPrivate: p.isPrivate };
      })
      .filter((m): m is (Meeting & { isPrivate: boolean }) => m !== null);

    const upcoming = joined.filter(m => new Date(m.date).getTime() + oneDayInMs >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const past = joined.filter(m => new Date(m.date).getTime() + oneDayInMs < now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { upcomingMeetings: upcoming, pastMeetings: past };
  }, [participations, allMeetings]);

  const handleSave = async () => {
    if (!editNickname.trim()) return;
    setIsSaving(true);
    try {
      await onUpdateProfile({ 
        nickname: editNickname, 
        bio: '', 
        interests: [] 
      });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert("프로필 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-40 px-10 text-center gap-10">
        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-400">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
           </svg>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">멤버십 가입이 필요해요</h2>
          <p className="text-sm text-slate-400 font-light leading-relaxed">
            나만의 소중한 일상을 기록하고 <br/> 새로운 친구들을 만나보세요.
          </p>
        </div>
      </div>
    );
  }

  // 차단 멤버 관리 서브 페이지 렌더링
  if (showBlockedList) {
    return (
      <div className="flex flex-col gap-8 px-6 pt-10 pb-40 page-enter">
        <header className="flex items-center gap-4">
          <button onClick={() => setShowBlockedList(false)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-slate-800">차단 멤버 관리</h2>
        </header>

        <div className="flex flex-col gap-4">
          {isLoadingBlocks ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin"></div>
              <p className="text-xs font-medium text-slate-400">목록을 불러오고 있습니다...</p>
            </div>
          ) : blockedUsers.length > 0 ? (
            blockedUsers.map(bUser => (
              <div 
                key={bUser.id} 
                className="w-full bg-white rounded-3xl p-5 border border-slate-100 flex justify-between items-center shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-sm font-bold text-slate-400 border border-slate-100">
                    {bUser.nickname.substring(0, 1)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">{bUser.nickname}</span>
                    <span className="text-[10px] text-slate-300 font-medium">활동 제한됨</span>
                  </div>
                </div>
                <button 
                  onClick={() => onUnblockUser(bUser.id)}
                  className="text-[11px] font-bold text-rose-500 bg-rose-50 px-4 py-2 rounded-full hover:bg-rose-100 transition-all active:scale-95"
                >
                  차단 해제
                </button>
              </div>
            ))
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30 flex flex-col gap-2 items-center">
              <p className="text-[12px] text-slate-300 font-medium tracking-tight">차단한 사용자가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-14 px-6 pt-10 pb-40 page-enter">
      {/* Profile Header */}
      <section className="flex flex-col items-center gap-6 relative">
        <div className="absolute top-0 right-0">
          {!isEditing ? (
            <button 
              onClick={() => {
                setIsEditing(true);
                setEditNickname(user.nickname);
              }}
              className="text-xs font-bold text-teal-500 bg-teal-50 px-4 py-2 rounded-full hover:bg-teal-100 transition-all"
            >
              수정하기
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => { 
                    setIsEditing(false); 
                    setEditNickname(user.nickname); 
                }}
                className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-full"
              >
                취소
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs font-bold text-white bg-teal-500 px-4 py-2 rounded-full shadow-md disabled:bg-slate-200"
              >
                {isSaving ? '...' : '저장'}
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="w-24 h-24 bg-teal-50 rounded-full border border-teal-100 flex items-center justify-center text-4xl shadow-sm overflow-hidden">
             <div className="w-full h-full flex items-center justify-center bg-teal-50 text-teal-600 font-bold text-2xl">
                {user.nickname.substring(0, 1)}
             </div>
          </div>
          {user.isCertified && (
             <div className="absolute bottom-0 right-0 w-8 h-8 bg-teal-500 border-4 border-white rounded-full flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 5.052 3.823 9.21 8.684 9.815a.485.485 0 00.632-.423m0-15.62c4.02.582 7.59 3.085 9.155 6.521a12.01 12.01 0 01-3.155 11.205m-4.987-16.1L12 3m0 0l-.013.01c-.137.017-.273.036-.408.057" />
                </svg>
             </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{isEditing ? '프로필 수정' : user.nickname}</h2>
          {isEditing && (
            <div className="flex flex-col gap-1 w-full max-w-[200px]">
              <input 
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-center font-bold text-slate-800 focus:outline-none focus:border-teal-200 transition-all"
                placeholder="닉네임 입력"
              />
            </div>
          )}
        </div>
      </section>

      {/* Timeline Section: Upcoming */}
      <section className="flex flex-col gap-6">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
           <div className="w-1 h-3 bg-teal-400 rounded-full"></div>
           진행 예정 모임 ({upcomingMeetings.length})
        </h3>
        <div className="flex flex-col gap-3">
          {upcomingMeetings.map(meeting => (
            <button 
              key={meeting.id} 
              onClick={() => onSelectMeeting(meeting.id)}
              className="w-full text-left bg-white rounded-2xl p-5 border border-slate-100 flex justify-between items-center card-shadow active:scale-[0.98] transition-all hover:border-teal-100"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold text-teal-500 uppercase">{meeting.category}</span>
                   <h4 className="font-bold text-slate-800 text-sm">{meeting.title}</h4>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {meeting.date} | {meeting.location}
                </span>
              </div>
              <div className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)] animate-pulse"></div>
            </button>
          ))}
          {upcomingMeetings.length === 0 && (
            <div className="py-12 text-center border border-dashed border-slate-100 rounded-3xl bg-slate-50/50 flex flex-col gap-2 items-center">
              <p className="text-[11px] text-slate-400 font-medium">참여 예정인 모임이 없습니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* Timeline Section: Past */}
      <section className="flex flex-col gap-6">
        <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
           <div className="w-1 h-3 bg-slate-300 rounded-full"></div>
           참여 완료 ({pastMeetings.length})
        </h3>
        <div className="flex flex-col gap-3">
          {pastMeetings.map(meeting => (
            <button 
              key={meeting.id} 
              onClick={() => onSelectMeeting(meeting.id)}
              className="w-full text-left bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex justify-between items-center opacity-70 transition-all hover:bg-white hover:opacity-100"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold text-slate-400 uppercase">{meeting.category}</span>
                   <h4 className="font-bold text-slate-500 text-sm">{meeting.title}</h4>
                </div>
                <span className="text-[11px] text-slate-300 font-medium">
                  {meeting.date.split(' ')[0]} | {meeting.location}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-300 bg-white px-2 py-0.5 rounded border border-slate-100">완료</span>
            </button>
          ))}
        </div>
      </section>

      {/* Settings / Management Section */}
      <section className="flex flex-col gap-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-1">Account & Privacy</h3>
        
        <button 
          onClick={() => setShowBlockedList(true)}
          className="w-full bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between group active:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-700">차단 멤버 관리</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">{user.blockedUserIds.length}명</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300 group-hover:text-teal-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </button>

        <button onClick={onLogout} className="w-full bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between group active:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-700">로그아웃</span>
          </div>
        </button>
      </section>

      <footer className="pt-4 flex flex-col items-center gap-4">
        <button 
          onClick={onWithdrawal}
          className="text-[10px] font-medium text-slate-300 hover:text-rose-400 transition-colors underline underline-offset-4"
        >
          서비스 탈퇴하기
        </button>
      </footer>
    </div>
  );
};

export default MyPageView;
