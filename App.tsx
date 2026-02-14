
import React, { useState, useEffect } from 'react';
import { ViewState, UserProfile, Meeting, UserParticipation } from './types';
import { MOCK_MEETINGS } from './constants';
import { db, doc, setDoc, getDoc, collection, query, onSnapshot, updateDoc, addDoc, increment, where, getDocs, deleteDoc, arrayUnion, arrayRemove, orderBy } from './firebase';
import PhoneAuthView from './views/PhoneAuthView';
import ProfileSetupView from './views/ProfileSetupView';
import WelcomeView from './views/WelcomeView';
import HomeView from './views/HomeView';
import MeetingDetailView from './views/MeetingDetailView';
import MyPageView from './views/MyPageView';
import MessagesView from './views/MessagesView';
import ChatRoomView from './views/ChatRoomView';
import CreateMeetingView from './views/CreateMeetingView';
import EditMeetingView from './views/EditMeetingView';
import Header from './components/Header';
import NavigationBar from './components/NavigationBar';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tempProfile, setTempProfile] = useState<Partial<UserProfile>>({});
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [participations, setParticipations] = useState<UserParticipation[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [unreadMeetingIds, setUnreadMeetingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedUserId = localStorage.getItem('bihon_user_id');
    if (savedUserId) {
      const unsubUser = onSnapshot(doc(db, 'users', savedUserId), (docSnap) => {
        if (docSnap.exists()) {
          setUser(docSnap.data() as UserProfile);
        }
      });
      const q = query(collection(db, 'participations'), where('userId', '==', savedUserId));
      const unsubParticipations = onSnapshot(q, (snapshot) => {
        const parts = snapshot.docs.map(doc => ({
          meetingId: doc.data().meetingId,
          isPrivate: doc.data().isPrivate
        }));
        setParticipations(parts);
      });
      return () => {
        unsubUser();
        unsubParticipations();
      };
    }
  }, []);

  useEffect(() => {
    const meetingsQuery = query(collection(db, 'meetings'));
    const unsubscribe = onSnapshot(meetingsQuery, (snapshot) => {
      const meetingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Meeting[];
      if (meetingsData.length === 0) setMeetings(MOCK_MEETINGS);
      else setMeetings(meetingsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || participations.length === 0) return;
    const unsubscribes = participations.map(p => {
      const msgQuery = query(collection(db, `meetings/${p.meetingId}/messages`), orderBy('timestamp', 'desc'));
      return onSnapshot(msgQuery, (snapshot) => {
        if (snapshot.empty) return;
        const latestMsg = snapshot.docs[0].data();
        if (latestMsg.senderId !== user.id && activeChatId !== p.meetingId) {
          setUnreadMeetingIds(prev => new Set(prev).add(p.meetingId));
        }
      });
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, [user?.id, participations, activeChatId]);

  useEffect(() => {
    if (activeChatId && unreadMeetingIds.has(activeChatId)) {
      setUnreadMeetingIds(prev => {
        const next = new Set(prev);
        next.delete(activeChatId);
        return next;
      });
    }
  }, [activeChatId, unreadMeetingIds]);

  const handlePhoneAuthComplete = async (phoneData: { phone: string; age: number }) => {
    const restrictionRef = doc(db, 'restricted_users', phoneData.phone);
    const restrictionSnap = await getDoc(restrictionRef);

    if (restrictionSnap.exists()) {
      const withdrawnAt = restrictionSnap.data().withdrawnAt.toDate().getTime();
      const now = new Date().getTime();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

      if (now - withdrawnAt < thirtyDaysInMs) {
        const remainingDays = Math.ceil((thirtyDaysInMs - (now - withdrawnAt)) / (24 * 60 * 60 * 1000));
        alert(`탈퇴 후 1개월간 재가입이 제한됩니다. (약 ${remainingDays}일 남음)\n건강한 커뮤니티를 위해 조금만 기다려 주세요.`);
        setView('HOME');
        return;
      }
    }

    setTempProfile(prev => ({ ...prev, phone: phoneData.phone, age: phoneData.age }));
    setView('PROFILE_SETUP');
  };

  const handleProfileSetupComplete = async (profileData: Partial<UserProfile>) => {
    const userId = `user_${Date.now()}`;
    const newUser: UserProfile = {
      id: userId,
      phone: tempProfile.phone || '',
      nickname: profileData.nickname || '익명',
      age: tempProfile.age || 35,
      isCertified: true,
      interests: profileData.interests || [],
      bio: profileData.bio || '',
      location: profileData.location || '서울',
      followerCount: 0,
      followingCount: 0,
      blockedUserIds: []
    };

    try {
      await setDoc(doc(db, 'users', userId), newUser);
      setUser(newUser);
      localStorage.setItem('bihon_user_id', userId);
      setView('WELCOME');
    } catch (e) {
      console.error("Error adding user: ", e);
      alert("프로필 저장 중 오류가 발생했습니다.");
    }
  };

  const handleBlockUser = async (targetId: string) => {
    if (!user || user.id === targetId) return;
    if (!window.confirm("이 사용자를 차단하시겠습니까? 차단된 사용자의 모임과 메시지가 더 이상 보이지 않습니다.")) return;
    
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        blockedUserIds: arrayUnion(targetId)
      });
    } catch (e) {
      console.error("Block error:", e);
      alert("차단 처리 중 오류가 발생했습니다.");
    }
  };

  const handleUnblockUser = async (targetId: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        blockedUserIds: arrayRemove(targetId)
      });
    } catch (e) {
      console.error("Unblock error:", e);
      alert("차단 해제 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm("정말로 이 모임을 삭제하시겠습니까? 삭제된 정보는 복구할 수 없습니다.")) return;
    try {
      // 1. 참여 정보 삭제
      const q = query(collection(db, 'participations'), where('meetingId', '==', meetingId));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // 2. 모임 문서 삭제
      await deleteDoc(doc(db, 'meetings', meetingId));
      
      setView('HOME');
      alert("모임이 삭제되었습니다.");
    } catch (e) {
      console.error("Delete meeting error:", e);
      alert("모임 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateMeeting = async (meetingId: string, updatedData: Partial<Meeting>) => {
    try {
      const meetingRef = doc(db, 'meetings', meetingId);
      await updateDoc(meetingRef, updatedData);
      setSelectedMeetingId(meetingId);
      setView('MEETING_DETAIL');
      alert("모임 정보가 수정되었습니다.");
    } catch (e) {
      console.error("Update meeting error:", e);
      alert("모임 수정 중 오류가 발생했습니다.");
    }
  };

  const handleWithdrawal = async () => {
    if (!user) return;
    if (window.confirm("정말로 탈퇴하시겠습니까? 탈퇴 후 1개월간 재가입이 금지됩니다.")) {
      try {
        if (user.phone) {
          await setDoc(doc(db, 'restricted_users', user.phone), {
            phone: user.phone,
            withdrawnAt: new Date()
          });
        }
        const q = query(collection(db, 'participations'), where('userId', '==', user.id));
        const snapshot = await getDocs(q);
        const batchPromises = snapshot.docs.map(async (pDoc) => {
          const mId = pDoc.data().meetingId;
          const meetingRef = doc(db, 'meetings', mId);
          const meetingSnap = await getDoc(meetingRef);
          if (meetingSnap.exists()) {
            await updateDoc(meetingRef, { currentParticipants: increment(-1) });
          }
          return deleteDoc(pDoc.ref);
        });
        await Promise.all(batchPromises);
        await deleteDoc(doc(db, 'users', user.id));
        setUser(null);
        localStorage.removeItem('bihon_user_id');
        setView('HOME');
        alert("탈퇴 처리가 완료되었습니다. 1개월 이후 재가입이 가능합니다.");
      } catch (e) {
        console.error("Withdrawal error: ", e);
        alert("탈퇴 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const handleUpdateProfile = async (data: { nickname: string; bio: string; interests: string[] }) => {
    if (user) {
      try {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, data);
        setUser({ ...user, ...data });
      } catch (e) {
        console.error("Error updating profile: ", e);
        throw e;
      }
    }
  };

  const handleJoinMeeting = async (meetingId: string) => {
    if (!user) { setView('AUTH_PHONE'); return; }
    const targetMeeting = meetings.find(m => m.id === meetingId);
    if (!targetMeeting) return;
    if (targetMeeting.currentParticipants >= targetMeeting.capacity) {
      alert("이미 정원이 가득 찬 모임입니다.");
      return;
    }
    
    const isAlreadyJoined = participations.some(p => p.meetingId === meetingId);
    if (!isAlreadyJoined) {
      try {
        await addDoc(collection(db, 'participations'), {
          userId: user.id,
          meetingId: meetingId,
          isPrivate: false,
          joinedAt: new Date()
        });
        const meetingRef = doc(db, 'meetings', meetingId);
        await updateDoc(meetingRef, { currentParticipants: increment(1) });
      } catch (e) { console.error(e); }
    }
    setActiveChatId(meetingId);
    setView('CHAT_ROOM');
  };

  const handleKickMembers = async (meetingId: string, userIds: string[]) => {
    if (userIds.length === 0) return;
    try {
      for (const uid of userIds) {
        const q = query(collection(db, 'participations'), where('meetingId', '==', meetingId), where('userId', '==', uid));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      }
      const meetingRef = doc(db, 'meetings', meetingId);
      await updateDoc(meetingRef, { currentParticipants: increment(-userIds.length) });
    } catch (e) { console.error(e); alert("내보내기 실패"); }
  };

  const handleCreateMeetingComplete = async (meetingData: Meeting) => {
    try {
      const { id, ...dataWithoutId } = meetingData;
      await setDoc(doc(db, 'meetings', id), dataWithoutId);
      await addDoc(collection(db, 'participations'), {
        userId: user!.id,
        meetingId: id,
        isPrivate: false,
        joinedAt: new Date()
      });
      setView('HOME');
    } catch (e) { console.error(e); throw e; }
  };

  const renderView = () => {
    switch (view) {
      case 'AUTH_PHONE': return <PhoneAuthView onComplete={handlePhoneAuthComplete} onCancel={() => setView('HOME')} />;
      case 'PROFILE_SETUP': return <ProfileSetupView onComplete={handleProfileSetupComplete} />;
      case 'WELCOME': return <WelcomeView onFinish={() => setView('HOME')} />;
      case 'HOME': return <HomeView user={user} meetings={meetings.filter(m => !user?.blockedUserIds.includes(m.hostId))} onSelectMeeting={(id) => { setActiveChatId(null); setSelectedMeetingId(id); setView('MEETING_DETAIL'); }} onCreateClick={() => { if (!user) setView('AUTH_PHONE'); else setView('CREATE_MEETING'); }} />;
      case 'MEETING_DETAIL': {
        const m = meetings.find(meeting => meeting.id === selectedMeetingId);
        return m ? <MeetingDetailView user={user} meeting={m} isJoined={participations.some(p => p.meetingId === m.id)} onJoin={handleJoinMeeting} onKickMembers={handleKickMembers} onBlockUser={handleBlockUser} onUnblockUser={handleUnblockUser} onDeleteMeeting={handleDeleteMeeting} onEditMeeting={() => setView('EDIT_MEETING')} onBack={() => activeChatId ? setView('CHAT_ROOM') : setView('HOME')} /> : null;
      }
      case 'CREATE_MEETING': return <CreateMeetingView user={user!} onComplete={handleCreateMeetingComplete} onBack={() => setView('HOME')} />;
      case 'EDIT_MEETING': {
        const m = meetings.find(meeting => meeting.id === selectedMeetingId);
        return m ? <EditMeetingView meeting={m} onComplete={(data) => handleUpdateMeeting(m.id, data)} onBack={() => setView('MEETING_DETAIL')} /> : null;
      }
      case 'MY_PAGE': return <MyPageView user={user} participations={participations} allMeetings={meetings} onToggleVisibility={() => {}} onLogout={() => { setUser(null); localStorage.removeItem('bihon_user_id'); setView('HOME'); }} onWithdrawal={handleWithdrawal} onUpdateProfile={handleUpdateProfile} onSelectMeeting={(id) => { setSelectedMeetingId(id); setView('MEETING_DETAIL'); }} onUnblockUser={handleUnblockUser} />;
      case 'CHATTING': return <MessagesView userParticipations={participations} allMeetings={meetings.filter(m => !user?.blockedUserIds.includes(m.hostId))} unreadMeetingIds={unreadMeetingIds} onSelectChat={(id) => { setActiveChatId(id); setView('CHAT_ROOM'); }} />;
      case 'CHAT_ROOM': {
        const m = meetings.find(meeting => meeting.id === activeChatId);
        return user && m ? <ChatRoomView user={user} meeting={m} onBack={() => setView('CHATTING')} onShowDetail={(id) => { setSelectedMeetingId(id); setView('MEETING_DETAIL'); }} onBlockUser={handleBlockUser} /> : null;
      }
      default: return <HomeView user={user} meetings={meetings} onSelectMeeting={(id) => { setSelectedMeetingId(id); setView('MEETING_DETAIL'); }} onCreateClick={() => setView('CREATE_MEETING')} />;
    }
  };

  const showHeader = ['HOME', 'MEETING_DETAIL', 'MY_PAGE', 'CHATTING', 'CREATE_MEETING', 'EDIT_MEETING', 'AUTH_PHONE', 'PROFILE_SETUP'].includes(view);
  const showNav = ['HOME', 'MY_PAGE', 'CHATTING'].includes(view);

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white relative border-x border-slate-100 shadow-sm">
      {showHeader && <Header title={view === 'HOME' ? '비혼뒤맑음' : ''} showBack={['MEETING_DETAIL', 'CREATE_MEETING', 'EDIT_MEETING', 'AUTH_PHONE', 'PROFILE_SETUP'].includes(view)} onBack={() => activeChatId ? setView('CHAT_ROOM') : setView('HOME')} />}
      <main className={`flex-1 overflow-y-auto ${showNav ? 'pb-32' : 'pb-16'}`}>
        <div className="page-enter">{renderView()}</div>
      </main>
      {showNav && <NavigationBar currentView={view} onViewChange={setView} hasChatBadge={unreadMeetingIds.size > 0} />}
    </div>
  );
};

export default App;
