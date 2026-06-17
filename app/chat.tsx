import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- SUPABASE ---
import { supabase } from '../lib/supabaseClient';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

const PressBtn = ({ onPress, style, children, disabled }: any) => {
    const scale = useRef(new Animated.Value(1)).current;
    const press = () => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 50 }).start();
    const release = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 60 }).start();
    return (
        <TouchableOpacity onPressIn={press} onPressOut={release} onPress={onPress} disabled={disabled} activeOpacity={1}>
            <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
        </TouchableOpacity>
    );
};

const AnimatedMessage = React.memo(({ item, isUser, handleReport }: any) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.messageCard, isUser ? styles.userCard : styles.assistantCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {!isUser ? (
        <View style={styles.cardHeader}>
           <Ionicons name="shield-checkmark" size={16} color="#0A84FF" />
           <Text style={styles.assistantLabel}>OMNIGUARD CORE</Text>
        </View>
      ) : (
        <View style={[styles.cardHeader, { justifyContent: 'flex-end' }]}>
           <Text style={styles.userLabel}>USER DIRECTIVE</Text>
           <Ionicons name="terminal" size={14} color="#5E5CE6" style={{marginLeft: 6}}/>
        </View>
      )}
      
      <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>{item.content}</Text>
      
      {!isUser && (
        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.reportIcon} onPress={() => handleReport(item.id)}>
            <Ionicons name="warning" size={12} color="#FF453A" style={{marginRight: 4}} />
            <Text style={{fontSize: 10, color: '#FF453A', fontWeight: '800', letterSpacing: 1}}>FLAG ANOMALY</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
});

export default function ChatScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  
  const initialMessage: Message = { id: 'initial', role: 'assistant', content: 'Hello! I am the OmniGuard AI Security Assistant. You can paste suspicious messages here or ask me questions about cybersecurity, and I will help you stay safe.' };
  
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id);
        loadSessions(data.user.id);
      }
    });
  }, []);

  const loadSessions = async (uid: string) => {
    try {
      const saved = await customStorage.getItem(`@omniguard_sessions_${uid}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
      }
    } catch (e) {
      console.error('Failed to load sessions', e);
    }
  };

  const saveSessions = async (uid: string, newSessions: ChatSession[]) => {
    try {
      await customStorage.setItem(`@omniguard_sessions_${uid}`, JSON.stringify(newSessions));
      setSessions(newSessions);
    } catch (e) {
      console.error('Failed to save sessions', e);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([initialMessage]);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
  };

  const deleteSession = (sessionId: string) => {
    if (!userId) return;
    
    const executeDelete = () => {
       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
       const newSessions = sessions.filter(s => s.id !== sessionId);
       saveSessions(userId, newSessions);
       if (currentSessionId === sessionId) {
          startNewChat();
       }
    };

    if (Platform.OS === 'web') {
       const confirmDelete = window.confirm('Are you sure you want to delete this conversation?');
       if (confirmDelete) executeDelete();
    } else {
       Alert.alert('Delete Chat', 'Are you sure you want to delete this conversation?', [
         { text: 'Cancel', style: 'cancel' },
         { text: 'Delete', style: 'destructive', onPress: executeDelete }
       ]);
    }
  };

  const orb1Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const orb2Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
      const createDriftAnimation = (animValue: Animated.ValueXY, range: number, duration: number) => {
          return Animated.loop(
              Animated.sequence([
                  Animated.timing(animValue, { toValue: { x: range, y: range }, duration: duration, useNativeDriver: true }),
                  Animated.timing(animValue, { toValue: { x: -range, y: range / 2 }, duration: duration * 1.2, useNativeDriver: true }),
                  Animated.timing(animValue, { toValue: { x: range / 2, y: -range }, duration: duration * 1.1, useNativeDriver: true }),
                  Animated.timing(animValue, { toValue: { x: 0, y: 0 }, duration: duration, useNativeDriver: true }),
              ])
          );
      };

      createDriftAnimation(orb1Anim, 50, 15000).start();
      createDriftAnimation(orb2Anim, -60, 18000).start();
  }, []);

  const updateSession = (msgs: Message[]) => {
    if (!userId) return;
    
    let sessionId = currentSessionId;
    let title = msgs.length > 1 ? msgs[1].content.substring(0, 20) + '...' : 'New Chat';
    
    if (!sessionId) {
       sessionId = Date.now().toString();
       setCurrentSessionId(sessionId);
       const newSession: ChatSession = { id: sessionId, title, messages: msgs, updatedAt: Date.now() };
       const updatedSessions = [newSession, ...sessions];
       saveSessions(userId, updatedSessions);
    } else {
       const updatedSessions = sessions.map(s => {
          if (s.id === sessionId) {
              return { ...s, messages: msgs, updatedAt: Date.now() };
          }
          return s;
       }).sort((a, b) => b.updatedAt - a.updatedAt);
       saveSessions(userId, updatedSessions);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: inputText.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    updateSession(newMessages);
    
    setInputText('');
    setIsTyping(true);
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Formulate messages for the edge function proxy (omitting IDs)
      const payloadMessages = newMessages.map(msg => ({ role: msg.role, content: msg.content }));

      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: payloadMessages }
      });

      if (error) throw error;

      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.choices[0].message.content
        };
        const updatedMessages = [...newMessages, assistantMsg];
        setMessages(updatedMessages);
        updateSession(updatedMessages);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
         throw new Error("Invalid response from AI");
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Connection Error', 'Could not reach the OmniGuard Intelligence server. Is your edge function deployed?');
      const errorMsg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Sorry, I am currently offline or cannot reach the server.'};
      const updatedMessages = [...newMessages, errorMsg];
      setMessages(updatedMessages);
      updateSession(updatedMessages);
    }

    setIsTyping(false);
  };

  const handleReport = (messageId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Report Content",
      "Do you want to report this AI response as offensive, harmful, or inaccurate? This is monitored by our trust & safety team.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Report", style: "destructive", onPress: () => Alert.alert("Reported", "Thank you. Our team will review this response.") }
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return <AnimatedMessage item={item} isUser={isUser} handleReport={handleReport} />;
  };

  return (
    <View style={styles.container}>
      {/* AURORA BACKGROUND WITH ANIMATION */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000' }]}>
        <Animated.View style={[styles.auroraOrb1, { transform: orb1Anim.getTranslateTransform() }]} />
        <Animated.View style={[styles.auroraOrb2, { transform: orb2Anim.getTranslateTransform() }]} />
        <View style={styles.auroraOrb3} />
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        
        <View style={{ flex: 1, width: '100%' }}>
          {/* Header */}
          <View style={styles.header}>
            <PressBtn onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
               <Ionicons name="chevron-back" size={24} color="#0A84FF" />
            </PressBtn>
            <Text style={styles.title}>OmniGuard AI</Text>
            <View style={{flexDirection: 'row'}}>
               {currentSessionId && (
                  <PressBtn onPress={() => deleteSession(currentSessionId)} style={styles.headerIconButton}>
                     <Ionicons name="trash-outline" size={22} color="#FF453A" />
                  </PressBtn>
               )}
               <PressBtn onPress={startNewChat} style={styles.headerIconButton}>
                  <Ionicons name="create-outline" size={24} color="#0A84FF" />
               </PressBtn>
            </View>
          </View>

          {/* Horizontal History Bar */}
          {sessions.length > 0 && (
            <View style={styles.historyBar}>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
                  <TouchableOpacity 
                     style={[styles.historyPill, currentSessionId === null && styles.activeHistoryPill]} 
                     onPress={startNewChat}
                  >
                     <Ionicons name="add" size={14} color={currentSessionId === null ? "#FFF" : "#8E8E93"} style={{marginRight: 4}} />
                     <Text style={[styles.historyText, currentSessionId === null && {color: '#FFF'}]}>New</Text>
                  </TouchableOpacity>
                  {sessions.map(session => (
                     <TouchableOpacity 
                        key={session.id} 
                        style={[styles.historyPill, currentSessionId === session.id && styles.activeHistoryPill]} 
                        onPress={() => loadSession(session)}
                     >
                        <Ionicons name="chatbubble-outline" size={12} color={currentSessionId === session.id ? "#FFF" : "#8E8E93"} style={{marginRight: 6}} />
                        <Text style={[styles.historyText, currentSessionId === session.id && {color: '#FFF'}]}>{session.title}</Text>
                     </TouchableOpacity>
                  ))}
               </ScrollView>
            </View>
          )}

          {/* Chat List */}
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 45}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.chatContainer}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {isTyping && (
               <View style={styles.typingContainer}>
                  <ActivityIndicator size="small" color="#06B6D4" />
                  <Text style={styles.typingText}>Analyzing threat...</Text>
               </View>
            )}

            {/* Floating Input Pill */}
            <View style={styles.inputContainer}>
              <BlurView intensity={90} tint="dark" style={styles.inputPill}>
                <TextInput
                  style={[styles.textInput, Platform.OS === 'web' && { outlineStyle: 'none', resize: 'none' } as any]}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Enter scan target or query..."
                  placeholderTextColor="#8E8E93"
                  multiline
                />
                <PressBtn style={styles.sendButton} onPress={sendMessage} disabled={isTyping || !inputText.trim()}>
                  <Ionicons name="send" size={18} color="#FFF" style={{ marginLeft: 2 }} />
                </PressBtn>
              </BlurView>
            </View>
          </KeyboardAvoidingView>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  auroraOrb1: { position: 'absolute', top: -50, left: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(10, 132, 255, 0.2)', opacity: 0.8 },
  auroraOrb2: { position: 'absolute', bottom: -50, right: -50, width: 350, height: 350, borderRadius: 175, backgroundColor: 'rgba(94, 92, 230, 0.2)', opacity: 0.8 },
  auroraOrb3: { position: 'absolute', top: '40%', left: '20%', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255, 69, 58, 0.15)', opacity: 0.6 },
  
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15, paddingTop: 10 },
  backButton: { padding: 10, width: 60, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  headerIconButton: { padding: 10, marginLeft: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  title: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },
  
  historyBar: { height: 50, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', justifyContent: 'center' },
  historyPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(28, 28, 30, 0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  activeHistoryPill: { backgroundColor: 'rgba(10, 132, 255, 0.2)', borderColor: '#0A84FF' },
  historyText: { color: '#8E8E93', fontSize: 12, fontWeight: '600' },

  chatContainer: { padding: 15, paddingBottom: 30 },
  
  messageCard: { width: '100%', marginBottom: 20, padding: 20, borderRadius: 16, borderWidth: 1 },
  userCard: { backgroundColor: 'rgba(94, 92, 230, 0.1)', borderColor: 'rgba(94, 92, 230, 0.3)', marginLeft: '10%', width: '90%', borderTopRightRadius: 4 },
  assistantCard: { backgroundColor: 'rgba(28, 28, 30, 0.8)', borderColor: 'rgba(255, 255, 255, 0.1)', marginRight: '10%', width: '90%', borderTopLeftRadius: 4, borderLeftWidth: 3, borderLeftColor: '#0A84FF' },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 8 },
  assistantLabel: { fontSize: 11, color: '#0A84FF', fontWeight: '800', letterSpacing: 1.5, marginLeft: 8 },
  userLabel: { fontSize: 11, color: '#5E5CE6', fontWeight: '800', letterSpacing: 1.5 },
  
  messageText: { fontSize: 15, lineHeight: 24 },
  userText: { color: '#E5E5EA' },
  assistantText: { color: '#FFFFFF' },
  
  cardFooter: { marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', justifyContent: 'flex-end' },
  reportIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 69, 58, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.2)' },
  
  typingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingBottom: 15 },
  typingText: { color: '#8E8E93', marginLeft: 10, fontSize: 12, fontStyle: 'italic', letterSpacing: 1 },

  inputContainer: { paddingHorizontal: 15, paddingBottom: Platform.OS === 'ios' ? 0 : 20, paddingTop: 10 },
  inputPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(28, 28, 30, 0.9)', borderRadius: 28, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  textInput: { flex: 1, color: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15, maxHeight: 120 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0A84FF', justifyContent: 'center', alignItems: 'center', shadowColor: '#0A84FF', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8 },
});
