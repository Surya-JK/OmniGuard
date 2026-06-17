import { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, ScrollView, Alert, Animated, Easing, Modal, FlatList, TextInput, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShareIntent } from 'expo-share-intent';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';

// 🖼️ GALLERY IMPORT
import * as ImagePicker from 'expo-image-picker';

// 🎨 NEW IMPORTS
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// --- SUPABASE ---
import { supabase } from '../lib/supabaseClient';

const SUSPICIOUS_KEYWORDS = [
  'support', 'refund', 'offer', 'prize', 'cashback', 'kyc', 'reward', 'admin', 
  'urgent', 'blocked', 'suspend', 'dear customer', 'lucky draw', 'electricity disconnect',
  'shortlisted', 'work from home'
];

const SCAM_TRENDS = [
  "Fake WhatsApp part-time job offers are on the rise.",
  "Never share your screen while scanning a QR code.",
  "Electricity disconnection SMS? Don't call the number, it's a trap.",
  "You don't need to enter a UPI PIN to receive money."
];

const BentoScaleButton = ({ onPress, style, children }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true }),
        Animated.spring(rotateAnim, { toValue: 1, useNativeDriver: true })
    ]).start();
  };
  const handlePressOut = () => {
    Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
        Animated.spring(rotateAnim, { toValue: 0, friction: 5, tension: 40, useNativeDriver: true })
    ]).start();
  };

  const rotateX = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '8deg']
  });

  return (
    <TouchableOpacity activeOpacity={0.9} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} style={style}>
      <Animated.View style={[{ flex: 1, overflow: 'hidden', borderRadius: style?.borderRadius || 22, transform: [{ perspective: 1000 }, { scale: scaleAnim }, { rotateX }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

const PressBtn = ({ onPress, style, children, disabled }: any) => {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 50 }).start();
  const release = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 60 }).start();
  return (
    <TouchableOpacity onPressIn={press} onPressOut={release} onPress={onPress} disabled={disabled} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

// NOTE: dev auth-bypass removed — use a real Supabase test account in CI.

export default function App() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [scannedUpi, setScannedUpi] = useState<string | null>(null);
  const [scannedAmount, setScannedAmount] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeImageUri, setActiveImageUri] = useState<string | null>(null);
  const [threatLevel, setThreatLevel] = useState<'SAFE' | 'DANGER' | null>(null);
  const [threatReason, setThreatReason] = useState<string | null>(null);
  const [cloudThreatDatabase, setCloudThreatDatabase] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scanMode, setScanMode] = useState<'TEXT' | 'QR'>('TEXT');
  const cameraRef = useRef<any>(null);
  const [threatHistory, setThreatHistory] = useState<any[]>([]);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<any | null>(null);
  const [isReportingFeedback, setIsReportingFeedback] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const scanSourceRef = useRef<'DOCUMENT' | 'QR_PAYLOAD' | 'RECEIPT' | 'SCAM_MESSAGE' | 'LINK_TEXT' | 'UNKNOWN'>('UNKNOWN');
  const [totalGlobalScans, setTotalGlobalScans] = useState(0);
  
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const [currentTrend, setCurrentTrend] = useState(SCAM_TRENDS[0]);
  const [isTextInputModalVisible, setIsTextInputModalVisible] = useState(false);
  const [inputTextToAnalyze, setInputTextToAnalyze] = useState('');

  // PRO STATE
  const [isPro, setIsPro] = useState(false);
  const [dailyScans, setDailyScans] = useState(0);

  // CHECK PRO STATUS ON LOAD
  useEffect(() => {
    const checkProStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase.from('profiles').select('is_pro, pro_expires_at').eq('id', session.user.id).single();
          if (data) {
            const isCurrentlyPro = data.is_pro && new Date(data.pro_expires_at) > new Date();
            setIsPro(isCurrentlyPro);
          }
        }
        
        // Load Daily Scans from Local Storage
        const storedDate = await AsyncStorage.getItem('scanDate');
        const today = new Date().toDateString();
        if (storedDate === today) {
           const scans = await AsyncStorage.getItem('scanCount');
           setDailyScans(scans ? parseInt(scans) : 0);
        } else {
           await AsyncStorage.setItem('scanDate', today);
           await AsyncStorage.setItem('scanCount', '0');
        }
      } catch (e) { console.error("Error loading profile", e); }
    };
    checkProStatus();
  }, []);

  // 🖼️ NATIVE GALLERY PICKER FUNCTION
  const pickImageFromGallery = async (sourceArg?: 'RECEIPT' | 'SCAM_MESSAGE' | 'DOCUMENT' | any) => {
    const source = typeof sourceArg === 'string' ? sourceArg : 'DOCUMENT';
    scanSourceRef.current = source;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // FIXED WARNING: Updated MediaTypes
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setIsCameraOpen(false); // Close camera if it was open
      analyzeImage(result.assets[0].uri);
    }
  };

  // 🔒 AUTHENTICATION CHECK
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let laserLoop: Animated.CompositeAnimation;
    if (isCameraOpen) {
      laserLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: scanMode === 'QR' ? 275 : 395, duration: 1500, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 1500, easing: Easing.linear, useNativeDriver: false })
        ])
      );
      laserLoop.start();
    } else {
      scanLineAnim.setValue(0);
    }
    return () => { if (laserLoop) laserLoop.stop(); };
  }, [isCameraOpen, scanLineAnim, scanMode]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const orb1Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const orb2Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.exp), useNativeDriver: true })
    ]).start();

    const createDriftAnimation = (animValue: Animated.ValueXY, range: number, duration: number) => {
        return Animated.loop(
            Animated.sequence([
                Animated.timing(animValue, { toValue: { x: range, y: range }, duration: duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(animValue, { toValue: { x: -range, y: range / 2 }, duration: duration * 1.2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(animValue, { toValue: { x: range / 2, y: -range }, duration: duration * 1.1, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(animValue, { toValue: { x: 0, y: 0 }, duration: duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        );
    };

    createDriftAnimation(orb1Anim, 60, 10000).start();
    createDriftAnimation(orb2Anim, -80, 12000).start();

    // Pulse animation for the header badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();

    // Rotate trends
    const trendInterval = setInterval(() => {
      setCurrentTrend(SCAM_TRENDS[Math.floor(Math.random() * SCAM_TRENDS.length)]);
    }, 8000);

    return () => clearInterval(trendInterval);
  }, []);

  const loadHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase.from('user_vaults').select('*').order('created_at', { ascending: false });
      if (data && !error) {
          const formattedHistory = data.map((item: any) => ({
              id: item.id,
              upi: item.upi_id,
              date: new Date(item.created_at).toLocaleString(),
              reason: item.reason,
              amount: item.amount,
              rawText: item.raw_text
          }));
          setThreatHistory(formattedHistory);
      } else {
          setThreatHistory([]);
      }
    } catch (e) { console.error("Failed to load history"); }
  };

  const fetchScammersAndCount = async () => {
    try {
      const { count } = await supabase.from('payload_logs').select('*', { count: 'exact', head: true });
      if (count !== null) setTotalGlobalScans(count);

      const { data, error } = await supabase.from('scammers').select('upi_id');
      if (data) {
        setCloudThreatDatabase(data.map((row: any) => row.upi_id));
      }
    } catch (error) {
      console.error('Error fetching global threat data', error);
    }
  };

  useEffect(() => {
    loadHistory();
    fetchScammersAndCount();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([loadHistory(), fetchScammersAndCount()]);
    setRefreshing(false);
  }, []);

  const logThreatLocally = async (upi: string | null, reason: string, amount: string | null, rawText: string) => {
    try {
      const newEntry = { id: Date.now().toString(), upi: upi || "Unknown / Hidden", date: new Date().toLocaleString(), reason: reason, amount: amount || "Not Detected", rawText: rawText || "No readable text found." };
      const updatedHistory = [newEntry, ...threatHistory];
      setThreatHistory(updatedHistory);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      await supabase.from('user_vaults').insert([{
          user_id: session.user.id,
          upi_id: upi || "Unknown / Hidden",
          reason: reason,
          amount: amount || "Not Detected",
          raw_text: rawText || "No readable text found."
      }]);
    } catch (e) {}
  };

  useEffect(() => {
    if (SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
      fetchScammersAndCount();
      
      // 📡 REAL-TIME SUBSCRIPTION
      const channelName = `public-db-changes-${Math.random()}`;
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scammers' }, (payload) => {
          setCloudThreatDatabase(prev => {
            if (payload.new && payload.new.upi_id && !prev.includes(payload.new.upi_id)) {
              return [...prev, payload.new.upi_id];
            }
            return prev;
          });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payload_logs' }, () => {
           setTotalGlobalScans(prev => prev + 1);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const reportThreatToCloud = async () => {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      return Alert.alert("Not Configured", "Please config your Supabase URL & Key to use global cloud.");
    }
    if (!scannedUpi || scannedUpi === "Unknown / Hidden") return Alert.alert("Cannot Report", "No specific ID found.");
    setIsUploading(true);
    try {
      const { error } = await supabase.from('scammers').insert([{ upi_id: scannedUpi }]);
      if (error) throw error;
      setCloudThreatDatabase(prev => [...prev, scannedUpi]);
      Alert.alert("Success!", "Threat reported to global database.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) { Alert.alert("Upload Failed", "Could not connect to database."); }
    setIsUploading(false);
  };

  const submitFeedback = async (correctResult: 'SAFE' | 'DANGER') => {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') return Alert.alert("Not Configured", "Please config Supabase to submit feedback.");
    setIsReportingFeedback(true);
    try {
      const { error } = await supabase.from('training_data').insert([{
        payload_type: scanSourceRef.current,
        raw_payload: extractedText,
        extracted_upi: scannedUpi,
        app_threat_level: threatLevel,
        user_correction: correctResult,
        amount: scannedAmount
      }]);
      if (error) throw error;
      setFeedbackGiven(true);
      Alert.alert("Feedback Received", "Thank you for training the system! Developers will review this payload.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Upload Failed", "Could not submit training data.");
    }
    setIsReportingFeedback(false);
  };

  const runForensicAnalysis = (rawText: string) => {
    const lines = rawText.split('\n');
    const fullTextLower = rawText.toLowerCase();

    // ==========================================
    // 🛡️ NEW ADVANCED LINK FORENSICS 🛡️
    // ==========================================
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    const urls = rawText.match(urlPattern);

    if (urls && urls.length > 0) {
      for (const url of urls) {
        const lowerUrl = url.toLowerCase();
        
        // 1. Detect URL Shorteners
        if (lowerUrl.includes('bit.ly') || lowerUrl.includes('t.co') || lowerUrl.includes('tinyurl.com') || lowerUrl.includes('goo.gl')) {
          return "LINK FORENSICS: URL Shortener detected. Scammers use this to hide malicious destinations.";
        }
        
        // 2. Detect raw IP address routing
        if (/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/.test(lowerUrl)) {
           return "LINK FORENSICS: Raw IP address link detected. Official apps/banks never route via raw IPs.";
        }
        
        // 3. Typo-squatting & Risk Domains
        if (/\.(xyz|top|site|online|tk|ml|ga|cf|gq)\//i.test(lowerUrl) || lowerUrl.includes('update-') || lowerUrl.includes('secure-') || lowerUrl.includes('-kyc')) {
          return "LINK FORENSICS: High-risk domain mapping or deceptive hyphens flagged as typosquatting.";
        }
        
        // 4. Panic Keywords contextual link check
        if (fullTextLower.includes('kyc') || fullTextLower.includes('update') || fullTextLower.includes('blocked') || fullTextLower.includes('locked') || fullTextLower.includes('secure')) {
          return "PHISHING DETECTED: Suspicious link combined with account panic keywords. Do not click.";
        }
      }
    }

    for (let line of lines) {
      const cleanLine = line.trim();
      
      if (cleanLine.match(/^7[\d,]+$/)) return "FORGERY DETECTED: Illegal Rupee Font rendering.";
      
      if (cleanLine.toUpperCase().includes('IFSC')) {
        if (/[A-Z]{4}O[A-Z0-9]{6}/i.test(cleanLine)) return "FORGERY DETECTED: Invalid IFSC formatting ('O' instead of Zero).";
      }

      if (cleanLine.match(/XX\s{2,}\d+/i) || cleanLine.match(/A\/c No\.\s+XX\s{2,}/i)) return "FORGERY DETECTED: Suspicious Account Number spacing.";
      if (cleanLine.match(/[a-zA-Z]+\s+,/)) return "FORGERY DETECTED: Grammatical UI anomaly (spoof generator).";
      if (cleanLine.match(/at\s\d{2}:\d{2}(AM|PM)/i)) return "FORGERY DETECTED: GPay Spoof App (missing time space).";
      if (cleanLine.match(/\d{1,2}\s+[a-zA-Z]+\s*,\s*\d{4}\s+at/i)) return "FORGERY DETECTED: GPay Spoof App ('at' in timestamp).";
    }

    if (fullTextLower.includes('dear customer') && (fullTextLower.includes('blocked') || fullTextLower.includes('suspend') || fullTextLower.includes('locked'))) return "SOCIAL ENGINEERING: Account suspension threat.";
    if ((fullTextLower.includes('electricity') || fullTextLower.includes('power')) && fullTextLower.includes('disconnect')) return "SCAM DETECTED: Electricity bill disconnection threat.";
    if (fullTextLower.includes('scan') && (fullTextLower.includes('receive') || fullTextLower.includes('cashback'))) return "PAYMENT TRAP: You don't scan QR codes to receive money.";
    if ((fullTextLower.includes('shortlisted') || fullTextLower.includes('recruiting')) && (fullTextLower.includes('work from home') || fullTextLower.includes('part time')) && (fullTextLower.includes('pay') || fullTextLower.includes('hour'))) return "EMPLOYMENT SCAM: Unsolicited high-pay WFH offer.";
    if ((fullTextLower.includes('refund') || fullTextLower.includes('refunding')) && (fullTextLower.includes('bank account') || fullTextLower.includes('routing number'))) return "FINANCIAL PHISHING: Request for direct routing numbers.";

    return null; 
  };

  const checkDailyScanLimit = async () => {
    return true; // APP IS NOW COMPLETELY FREE AND UNLIMITED!
  };

  const handleQRScan = async (scanningResult: { data: string }) => {
    if (scanMode !== 'QR') return;
    scanSourceRef.current = 'QR_PAYLOAD';
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const qrData = scanningResult.data;
    if (qrData.startsWith('upi://pay')) {
      setIsCameraOpen(false); 
      setIsScanning(true);
      setActiveImageUri('https://cdn-icons-png.flaticon.com/512/825/825562.png'); 
      try {
        const params = qrData.split('?')[1]?.split('&');
        let payeeId = null, payeeName = null, amount = null;
        if (params) {
          params.forEach(param => {
            const [key, value] = param.split('=');
            if (key === 'pa') payeeId = decodeURIComponent(value);
            if (key === 'pn') payeeName = decodeURIComponent(value);
            if (key === 'am') amount = decodeURIComponent(value);
          });
        }
        setScannedUpi(payeeId || "Hidden / Unknown");
        setScannedAmount(amount ? amount : "User Defined");
        setExtractedText(`[INTERCEPTED PAYLOAD]\n${qrData}`);
        
        let threatLevelStr: 'SAFE' | 'DANGER' | null = 'DANGER';
        let reasonStr: string | null = `MALICIOUS QR TRAP: Hidden payment to ${payeeName || 'an unknown source'}.`;

        // AI FORENSIC ANALYSIS
        const canScan = await checkDailyScanLimit();
        if (canScan) {
          try {
            const { data, error } = await supabase.functions.invoke('analyze-threat', {
              body: { text: `[QR URI]: ${qrData}\n[Payee]: ${payeeName}\n[Amount]: ${amount}` }
            });
            if (!error && data && data.threat_level) {
              threatLevelStr = data.threat_level;
              reasonStr = data.reason;
            }
          } catch (err) {
            console.log("AI Analysis failed, falling back to local rules.");
          }
        } else {
           console.log("Daily API scan limit reached, enforcing local rules only.");
        }

        setThreatLevel(threatLevelStr);
        setThreatReason(threatLevelStr === 'DANGER' ? `AI DETECTED: ${reasonStr}` : null);
        if (threatLevelStr === 'DANGER') logThreatLocally(payeeId || "Hidden", reasonStr || "Risk Identified", amount, qrData);
      } catch (e) {}
      setIsScanning(false);
    }
  };

  const finishAnalysis = (
    finalUpi: string | null,
    foundAmount: string | null,
    rawText: string,
    forensicReport: string | null
  ) => {
    let currentThreatLevel = 'SAFE';
    let currentThreatReason = null;

    if (forensicReport) {
      currentThreatLevel = 'DANGER'; currentThreatReason = forensicReport;
      setThreatLevel('DANGER'); setThreatReason(forensicReport); logThreatLocally(finalUpi, forensicReport, foundAmount, rawText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (finalUpi) {
      if (cloudThreatDatabase.includes(finalUpi)) {
        currentThreatLevel = 'DANGER'; currentThreatReason = "LIVE CLOUD THREAT: Exact ID match in database.";
        setThreatLevel('DANGER'); setThreatReason(currentThreatReason); logThreatLocally(finalUpi, "Cloud Match", foundAmount, rawText);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (SUSPICIOUS_KEYWORDS.some(k => finalUpi.toLowerCase().includes(k))) {
        currentThreatLevel = 'DANGER'; currentThreatReason = "Suspicious keyword in ID. Official banks do not use these words.";
        setThreatLevel('DANGER'); setThreatReason(currentThreatReason); logThreatLocally(finalUpi, "Keyword Match", foundAmount, rawText);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else { 
        setThreatLevel('SAFE'); 
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else { 
      setThreatLevel('SAFE'); 
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Cloud Auto-Log (Only store if it is a SCAM/DANGER)
    if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && currentThreatLevel === 'DANGER') {
      supabase.from('payload_logs').insert([{
        payload_type: scanSourceRef.current,
        raw_payload: rawText,
        extracted_upi: finalUpi,
        threat_level: currentThreatLevel,
        threat_reason: currentThreatReason,
        amount: foundAmount
      }]).then(({ error }) => {
         if (error) console.log('Payload logging error:', error);
      });
    }

    setIsScanning(false);
  }

  const parseExtractedText = async (rawText: string) => {
    setExtractedText(rawText); 

    // Prevent false positives when scanning OmniGuard's own UI
    const lowerText = rawText.toLowerCase();
    const isAppUI = (lowerText.includes('scan trends') && lowerText.includes('live threats')) || 
                    (lowerText.includes('omniguard core') && lowerText.includes('user directive'));
    
    if (isAppUI) {
      setScannedUpi(null);
      setScannedAmount(null);
      finishAnalysis(null, null, rawText, null);
      return;
    }

    let forensicReport = runForensicAnalysis(rawText);
    const upiMatch = rawText.match(/[a-zA-Z0-9.\-_]{2,}\s*@\s*[a-zA-Z0-9.\-_]{2,}/);
    const finalUpi = upiMatch ? upiMatch[0].replace(/\s+/g, '') : null;
    setScannedUpi(finalUpi);

    let foundAmount = null;
    const lines = rawText.split('\n'); 
    for (let i = 0; i < lines.length; i++) {
        const cleanLine = lines[i].trim();
        if (cleanLine.includes('₹') || cleanLine.toLowerCase().includes('rs')) {
            const match = cleanLine.match(/[\d,]+(?:\.\d{1,2})?/);
            if (match) { foundAmount = match[0]; break; }
        } else if (/^[\d,]+(?:\.\d{1,2})?$/.test(cleanLine) && cleanLine.replace(/,/g, '').length < 10) {
            foundAmount = cleanLine; 
            if (foundAmount.startsWith('7') && i + 1 < lines.length && lines[i+1].toLowerCase().includes('rupees')) foundAmount = foundAmount.substring(1); 
            break; 
        }
    }
    setScannedAmount(foundAmount);

    // AI FORENSIC ANALYSIS
    if (rawText && rawText.length > 5) {
      const canScan = await checkDailyScanLimit();
      if (canScan) {
        try {
          const { data, error } = await supabase.functions.invoke('analyze-threat', {
            body: { text: rawText }
          });
          if (!error && data && data.threat_level) {
            if (data.threat_level === 'DANGER') {
              forensicReport = `AI DETECTED: ${data.reason}`;
            } else if (data.threat_level === 'SAFE') {
               // Overwrite deterministic rules if AI deems it safe
               forensicReport = null; 
            }
          }
        } catch (err) {
          console.log("AI Analysis failed, falling back to local deterministic rules.");
        }
      } else {
        console.log("Daily API scan limit reached, enforcing local rules only.");
      }
    }

    finishAnalysis(finalUpi, foundAmount, rawText, forensicReport);
  }

  const analyzeImage = async (uri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveImageUri(uri);
    setIsScanning(true);
    setThreatLevel(null);
    setThreatReason(null);
    
    try {
      const result = await TextRecognition.recognize(uri);
      const rawText = result.text;
      parseExtractedText(rawText);
    } catch (error) { 
      setExtractedText("Error reading image."); 
      setIsScanning(false);
    }
  };

  const analyzeDirectText = () => {
    scanSourceRef.current = 'LINK_TEXT';
    setIsTextInputModalVisible(false);
    if (!inputTextToAnalyze.trim()) return;
    setActiveImageUri('https://cdn-icons-png.flaticon.com/512/825/825275.png'); // Document icon
    setIsScanning(true);
    setThreatLevel(null);
    setThreatReason(null);
    parseExtractedText(inputTextToAnalyze);
    setInputTextToAnalyze('');
  }

  useEffect(() => {
    if (hasShareIntent && shareIntent) {
      if (shareIntent.files && shareIntent.files.length > 0 && shareIntent.files[0].path) {
        scanSourceRef.current = 'DOCUMENT';
        analyzeImage(shareIntent.files[0].path);
      } else if (shareIntent.value) {
        scanSourceRef.current = 'LINK_TEXT';
        setActiveImageUri('https://cdn-icons-png.flaticon.com/512/825/825275.png');
        setIsScanning(true);
        setThreatLevel(null);
        setThreatReason(null);
        parseExtractedText(shareIntent.value);
      }
    }
  }, [hasShareIntent, shareIntent]);

  const clearAll = () => { 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExtractedText(null); 
    setScannedUpi(null); 
    setScannedAmount(null); 
    setThreatLevel(null); 
    setThreatReason(null); 
    setActiveImageUri(null); 
    setFeedbackGiven(false);
    resetShareIntent(); 
  };
  const isDanger = threatLevel === 'DANGER';

  const closeHistoryVault = () => {
    setIsHistoryModalVisible(false);
    setSelectedThreat(null);
  };

  if (isCameraOpen) {
    if (!permission?.granted) return (
      <SafeAreaView style={[styles.container, {backgroundColor: '#050B14'}]}><Text style={styles.subText}>OmniGuard needs camera access.</Text><TouchableOpacity style={styles.neonPrimaryBtn} onPress={requestPermission}><Text style={styles.buttonText}>Grant Permission</Text></TouchableOpacity></SafeAreaView>
    );
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView style={StyleSheet.absoluteFillObject} facing="back" ref={cameraRef} barcodeScannerSettings={scanMode === 'QR' ? { barcodeTypes: ["qr"] } : undefined} onBarcodeScanned={scanMode === 'QR' ? handleQRScan : undefined} />
        
        <BlurView intensity={70} tint="dark" style={[StyleSheet.absoluteFillObject, styles.cameraOverlay]}>
          <SafeAreaView style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={styles.segmentedControl}>
              <TouchableOpacity style={[styles.segmentTab, scanMode === 'TEXT' && styles.segmentTabActive]} onPress={() => { setScanMode('TEXT'); Haptics.selectionAsync(); }}>
                <Text style={[styles.segmentText, scanMode === 'TEXT' && styles.segmentTextActive]}>📄 Document</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.segmentTab, scanMode === 'QR' && styles.segmentTabActive]} onPress={() => { setScanMode('QR'); Haptics.selectionAsync(); }}>
                <Text style={[styles.segmentText, scanMode === 'QR' && styles.segmentTextActive]}>🔳 QR Payload</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.scannerFrame, { borderColor: scanMode === 'QR' ? '#A855F7' : '#00F0FF', height: scanMode === 'QR' ? 280 : 400, shadowColor: scanMode === 'QR' ? '#A855F7' : '#00F0FF', shadowOpacity: 0.8, shadowRadius: 15 }]}>
              <Animated.View style={[styles.laserLine, { transform: [{ translateY: scanLineAnim }], backgroundColor: scanMode === 'QR' ? '#A855F7' : '#00F0FF' }]} />
            </View>
            
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.glassCircNav} onPress={pickImageFromGallery}>
                <Text style={{fontSize: 24}}>🖼️</Text>
              </TouchableOpacity>

              {scanMode === 'TEXT' ? (
                <TouchableOpacity style={styles.captureButton} onPress={async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); if(cameraRef.current) { const p = await cameraRef.current.takePictureAsync(); setIsCameraOpen(false); analyzeImage(p.uri); }}}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              ) : (<View style={{ width: 80, height: 80, justifyContent: 'center', alignItems: 'center' }}><Text style={{color: '#A855F7', fontWeight: 'bold', fontSize: 16}}>Scanning...</Text></View>)}
              
              <TouchableOpacity style={styles.glassCircNav} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsCameraOpen(false); }}>
                <Text style={{fontSize: 24, color: '#fff', fontWeight: 'bold'}}>✕</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </BlurView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* AMBIENT FLOATING ORBS */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000' }]}>
          <Animated.View style={[styles.floatingOrb, { backgroundColor: 'rgba(10, 132, 255, 0.25)', top: '10%', left: '10%', transform: orb1Anim.getTranslateTransform() }]} />
          <Animated.View style={[styles.floatingOrb, { backgroundColor: 'rgba(94, 92, 230, 0.25)', bottom: '10%', right: '10%', transform: orb2Anim.getTranslateTransform() }]} />
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject} />
      </View>

      <SafeAreaView style={{flex: 1, width: '100%', alignItems: 'center'}}>
        {/* FLOATING HEADER */}
        <View style={styles.floatingHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="shield-checkmark" size={24} color="#00F0FF" style={{ marginRight: 10 }} />
                <Text style={styles.title}>OmniGuard</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <TouchableOpacity onPress={async () => {
                    Haptics.impactAsync();
                    await supabase.auth.signOut();
                }} style={[styles.vaultBadge, {borderColor: 'rgba(239, 68, 68, 0.3)', paddingHorizontal: 8}]}>
                    <Ionicons name="log-out-outline" size={14} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/reports'); }} style={styles.vaultBadge}>
                    <Ionicons name="document-text-outline" size={12} color="#00F0FF" style={{ marginRight: 6 }} />
                    <Text style={[styles.vaultBadgeText, { color: '#00F0FF' }]}>Reports</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsHistoryModalVisible(true); }} style={styles.vaultBadge}>
                    <Ionicons name="server-outline" size={12} color="#CBD5E1" style={{ marginRight: 6 }} />
                    <Text style={styles.vaultBadgeText}>Vault ({threatHistory.length})</Text>
                </TouchableOpacity>
            </View>
        </View>
  
        <Animated.View style={{ flex: 1, width: '100%', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView 
          contentContainerStyle={{ alignItems: 'center', paddingBottom: 50, paddingTop: 10, width: '100%' }} 
          style={{ width: '100%' }} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0A84FF" colors={['#0A84FF']} />}
        >
          <View style={styles.mainContentArea}>
            {/* STATS BENTO ROW */}
            {!activeImageUri && (
              <View style={styles.bentoRow}>
                 <BlurView intensity={40} tint="dark" style={styles.bentoStatCard}>
                   <Text style={styles.statLabel}>Cloud Scans</Text>
                   <Text style={[styles.statValue, {color: '#00F0FF'}]}>{totalGlobalScans}</Text>
                 </BlurView>
                 <BlurView intensity={40} tint="dark" style={styles.bentoStatCard}>
                   <Text style={styles.statLabel}>Live Threats</Text>
                   <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Animated.View style={[styles.statusDot, { opacity: pulseAnim }]} />
                      <Text style={[styles.statValue, {color: '#EF4444'}]}>{cloudThreatDatabase.length}</Text>
                   </View>
                 </BlurView>
              </View>
            )}

            {/* EDUCATIONAL BANNER */}
            {!activeImageUri && (
               <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.5)']} style={styles.bentoCardHero}>
                 <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                   <Ionicons name="bulb" size={16} color="#FCD34D" style={{ marginRight: 8 }} />
                   <Text style={styles.bannerTitle}>SCAN TRENDS</Text>
                 </View>
                 <Text style={styles.bannerText} numberOfLines={2}>{currentTrend}</Text>
               </LinearGradient>
            )}

            {activeImageUri ? (
               <View style={{ alignItems: 'center', width: '100%' }}>
                 <View style={[styles.resultBadge, {backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', borderColor: isDanger ? '#EF4444' : '#00FF9D', shadowColor: isDanger ? '#EF4444' : '#00FF9D', shadowOpacity: 0.5, shadowRadius: 15}]}>
                   <Text style={[styles.resultBadgeText, { color: isDanger ? '#EF4444' : '#00FF9D' }]}>{isDanger ? "🚨 THREAT INTERCEPTED" : "✅ SYSTEM CLEAR"}</Text>
                 </View>
                 
                 <Image source={{ uri: activeImageUri }} style={styles.previewImage} />
                 
                 {isScanning ? (
                   <View style={{alignItems: 'center', padding: 30}}><ActivityIndicator size="large" color="#00F0FF" /><Text style={{color:'#94A3B8', marginTop: 10, fontWeight: 'bold'}}>Analyzing Forensics...</Text></View>
                 ) : (
                   <View style={{ width: '100%' }}>
                     <BlurView intensity={50} tint="dark" style={styles.dataContainer}>
                       <View style={styles.dataRow}><Text style={styles.dataLabel}>Target Entity:</Text><Text style={styles.dataValue} numberOfLines={1}>{scannedUpi || "N/A"}</Text></View>
                       <View style={styles.dataRow}><Text style={styles.dataLabel}>Value Intercepted:</Text><Text style={[styles.dataValue, {color: '#00F0FF'}]}>{scannedAmount ? `₹${scannedAmount}` : "N/A"}</Text></View>
                       {isDanger && threatReason && (<View style={styles.warningBox}><Text style={styles.warningText}>{threatReason}</Text></View>)}
                     </BlurView>
                   </View>
                 )}

                 {!isScanning && (
                   <View style={{width: '100%', gap: 12, marginTop: 25}}>
                     {isDanger && scannedUpi && !cloudThreatDatabase.includes(scannedUpi) && (
                       <PressBtn style={styles.neonDangerBtn} onPress={reportThreatToCloud} disabled={isUploading}>
                         <LinearGradient colors={['#991B1B', '#DC2626']} style={StyleSheet.absoluteFillObject} />
                         {isUploading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonText}>Upload to Database</Text>}
                       </PressBtn>
                     )}
                     {!feedbackGiven && (
                       <PressBtn style={[styles.glassBtn, {borderColor: 'rgba(252, 211, 77, 0.4)'}]} onPress={() => {
                         Alert.alert(
                           "Train System",
                           "Was our detection incorrect? Tell us what this actually is to improve our heuristics.",
                           [
                             { text: "It's Safe", onPress: () => submitFeedback('SAFE') },
                             { text: "It's a Scam", onPress: () => submitFeedback('DANGER'), style: 'destructive' },
                             { text: "Cancel", style: "cancel" }
                           ]
                         );
                       }}>
                         {isReportingFeedback ? <ActivityIndicator size="small" color="#FCD34D" /> : <Text style={[styles.ghostButtonText, {color: '#FCD34D'}]}>Report Incorrect Result</Text>}
                       </PressBtn>
                     )}
                     <PressBtn style={styles.glassBtn} onPress={clearAll}><Text style={styles.buttonText}>Clear Terminal</Text></PressBtn>
                   </View>
                 )}
               </View>
            ) : (
               <View style={{ alignItems: 'center', width: '100%' }}>
                 
                 {/* BENTO HERO: CAMERA */}
                 <BentoScaleButton style={styles.bentoHero} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); scanSourceRef.current = 'DOCUMENT'; setScanMode('TEXT'); setIsCameraOpen(true); }}>
                   <BlurView intensity={20} tint="dark" style={styles.bentoHeroBlur}>
                     <View style={styles.bentoHeroInner}>
                       <Ionicons name="scan-circle" size={48} color="#0A84FF" />
                       <View>
                           <Text style={styles.bentoHeroTitle}>LIVE CAMERA CHECK</Text>
                           <Text style={styles.bentoHeroSub}>Scan Document or QR Code</Text>
                       </View>
                     </View>
                   </BlurView>
                 </BentoScaleButton>

                 {/* ASYMMETRIC GRID START */}
                 <View style={styles.bentoAsymmGrid}>
                    <BentoScaleButton style={styles.bentoTallCard} onPress={() => pickImageFromGallery('SCAM_MESSAGE')}>
                       <BlurView intensity={20} tint="dark" style={styles.bentoCardInner}>
                           <Ionicons name="chatbubble-ellipses" size={42} color="#0A84FF" style={{ marginBottom: 20 }} />
                           <Text style={styles.gridCardTitle}>Scam Msg Check</Text>
                           <Text style={styles.gridCardSub}>Analyze image</Text>
                       </BlurView>
                    </BentoScaleButton>
                    
                    <View style={styles.bentoRightCol}>
                        <BentoScaleButton style={styles.bentoShortCard} onPress={() => pickImageFromGallery('RECEIPT')}>
                           <BlurView intensity={20} tint="dark" style={[styles.bentoCardInner, {flexDirection: 'row', gap: 15, paddingHorizontal: 20}]}>
                               <Ionicons name="receipt" size={32} color="#0A84FF" />
                               <View style={{flex: 1, justifyContent: 'center'}}>
                                   <Text style={styles.gridCardTitle} numberOfLines={1}>Receipt Scan</Text>
                                   <Text style={styles.gridCardSub} numberOfLines={1}>Detect forgery</Text>
                               </View>
                           </BlurView>
                        </BentoScaleButton>
                        <BentoScaleButton style={styles.bentoShortCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); scanSourceRef.current = 'LINK_TEXT'; setIsTextInputModalVisible(true) }}>
                           <BlurView intensity={20} tint="dark" style={[styles.bentoCardInner, {flexDirection: 'row', gap: 15, paddingHorizontal: 20}]}>
                               <Ionicons name="link" size={32} color="#0A84FF" />
                               <View style={{flex: 1, justifyContent: 'center'}}>
                                   <Text style={styles.gridCardTitle} numberOfLines={1}>Paste Links</Text>
                                   <Text style={styles.gridCardSub} numberOfLines={1}>Direct lookup</Text>
                               </View>
                           </BlurView>
                        </BentoScaleButton>
                    </View>
                 </View>
                 {/* ASYMMETRIC GRID END */}

                 {/* ASSISTANT PORTAL */}
                 <BentoScaleButton style={styles.assistantPortal} onPress={() => { Haptics.impactAsync(); router.push('/chat'); }}>
                    <LinearGradient colors={['#2563EB', '#1E3A8A']} style={StyleSheet.absoluteFillObject} />
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 20, paddingHorizontal: 25, paddingVertical: 20}}>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 20 }}>
                          <Ionicons name="shield-half" size={32} color="#fff" />
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.portalTitle}>AI SECURITY ASSISTANT</Text>
                            <Text style={styles.portalSub}>Chat with the OmniGuard Intelligence</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={28} color="#93C5FD" />
                    </View>
                 </BentoScaleButton>

               </View>
            )}
          </View>
        </ScrollView>
        </Animated.View>

        {/* 📜 TEXT INPUT MODAL (SLIDE UP BENTO) 📜 */}
        <Modal visible={isTextInputModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalBackdrop}>
             <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIsTextInputModalVisible(false)} />
             <BlurView intensity={80} tint="dark" style={styles.bottomSheet}>
                <View style={styles.dragHandle} />
                <Text style={styles.modalTitle}>Inspect Payload</Text>
                <TextInput
                  style={[styles.bentoTextInput, Platform.OS === 'web' && { outlineStyle: 'none', resize: 'none' } as any]}
                  multiline
                  placeholder="Paste SMS message, suspicious URL, or text payload here..."
                  placeholderTextColor="#475569"
                  value={inputTextToAnalyze}
                  onChangeText={setInputTextToAnalyze}
                />
                <View style={{flexDirection: 'row', gap: 12, marginTop: 24, paddingBottom: Platform.OS === 'ios' ? 20 : 0}}>
                  <TouchableOpacity style={[styles.glassBtn, {flex: 1}]} onPress={() => setIsTextInputModalVisible(false)}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.neonPrimaryBtn, {flex: 1, elevation: 10}]} onPress={analyzeDirectText}>
                    <LinearGradient colors={['#D97706', '#B45309']} style={StyleSheet.absoluteFillObject} />
                    <Text style={[styles.buttonText, {textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width:0, height:1}, textShadowRadius: 2}]}>Initiate Scan</Text>
                  </TouchableOpacity>
                </View>
             </BlurView>
          </View>
        </Modal>

        {/* 📜 HISTORY MODAL (SLIDE UP BENTO) 📜 */}
        <Modal visible={isHistoryModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalBackdrop}>
             <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeHistoryVault} />
             <BlurView intensity={80} tint="dark" style={[styles.bottomSheet, {height: '85%'}]}>
               <View style={styles.dragHandle} />
               {selectedThreat ? (
                 <View style={{ flex: 1, width: '100%' }}>
                   <Text style={styles.modalTitle}>Vault Record</Text>
                   <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                     <View style={styles.glassPanel}>
                       <Text style={styles.dataLabel}>Timestamp: <Text style={{color: '#E2E8F0', fontWeight: 'bold'}}>{selectedThreat.date}</Text></Text>
                       <View style={styles.divider}/>
                       <Text style={styles.dataLabel}>Entity: <Text style={{color: '#EF4444', fontWeight:'900', letterSpacing: 0.5}}>{selectedThreat.upi}</Text></Text>
                       <Text style={styles.dataLabel}>Risk Value: <Text style={{color: '#FBBF24'}}>{selectedThreat.amount !== "Not Detected" ? `₹${selectedThreat.amount}` : "N/A"}</Text></Text>
                     </View>
                     <Text style={[styles.dataLabel, { marginTop: 20, marginBottom: 8, color: '#00F0FF' }]}>Forensic Trigger</Text>
                     <View style={styles.warningBox}><Text style={styles.warningText}>{selectedThreat.reason}</Text></View>
                     <Text style={[styles.dataLabel, { marginTop: 25, marginBottom: 8, color: '#A855F7' }]}>Decrypted Payload</Text>
                     <View style={styles.codeBox}><Text style={styles.codeText}>{selectedThreat.rawText}</Text></View>
                   </ScrollView>
                   <TouchableOpacity style={[styles.glassBtn, {marginBottom: Platform.OS === 'ios' ? 20 : 0}]} onPress={() => { setSelectedThreat(null); Haptics.impactAsync(); }}><Text style={styles.buttonText}>Back to Vault</Text></TouchableOpacity>
                 </View>
               ) : (
                 <View style={{ flex: 1, width: '100%' }}>
                   <Text style={[styles.modalTitle, {color: '#00F0FF'}]}>Local Threat Vault</Text>
                   <FlatList
                     data={threatHistory}
                     keyExtractor={item => item.id}
                     showsVerticalScrollIndicator={false}
                     renderItem={({item}) => (
                       <TouchableOpacity style={styles.bentoListItem} onPress={() => { setSelectedThreat(item); Haptics.selectionAsync(); }}>
                         <Text style={styles.historyDate}>{item.date}</Text>
                         <Text style={styles.historyUpi} numberOfLines={1}>{item.upi}</Text>
                         <Text style={styles.historyReason} numberOfLines={1}>{item.reason}</Text>
                       </TouchableOpacity>
                     )}
                     ListEmptyComponent={<Text style={{color: '#64748B', textAlign: 'center', marginTop: 40, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'}}>0 THREATS LOGGED</Text>}
                   />
                   <TouchableOpacity style={[styles.glassBtn, {marginTop: 15, marginBottom: Platform.OS === 'ios' ? 20 : 0}]} onPress={closeHistoryVault}><Text style={styles.buttonText}>Exit Vault</Text></TouchableOpacity>
                 </View>
               )}
             </BlurView>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  floatingOrb: { position: 'absolute', width: 500, height: 500, borderRadius: 250 },
  
  floatingHeader: { 
    width: '94%', marginVertical: 15, flexDirection: 'row', justifyContent: 'space-between', 
    alignItems: 'center', backgroundColor: 'rgba(28, 28, 30, 0.95)', paddingHorizontal: 20, 
    paddingVertical: 14, borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#0A84FF', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }
  },
  titleIcon: { fontSize: 22, marginRight: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  vaultBadge: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(44,44,46,0.9)', 
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)' 
  },
  vaultBadgeText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },

  bentoRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 16, gap: 14 },
  bentoStatCard: { 
    flex: 1, paddingVertical: 22, paddingHorizontal: 20, borderRadius: 24, 
    backgroundColor: 'rgba(28, 28, 30, 0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden'
  },
  statLabel: { color: '#636366', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  statValue: { fontSize: 36, fontWeight: '800', fontVariant: ['tabular-nums'], color: '#FFFFFF', letterSpacing: -1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF453A', marginRight: 8, shadowColor: '#FF453A', shadowOpacity: 1, shadowRadius: 8 },

  bentoCardHero: { 
    width: '100%', minHeight: 90, justifyContent: 'center', padding: 20, borderRadius: 24, 
    backgroundColor: 'rgba(28, 28, 30, 0.9)', marginBottom: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255, 214, 10, 0.15)'
  },
  bannerTitle: { color: '#FFD60A', fontWeight: '800', fontSize: 11, letterSpacing: 2, marginBottom: 6 },
  bannerText: { color: '#E5E5EA', fontSize: 15, lineHeight: 22, fontWeight: '500' },

  mainContentArea: { width: '94%' },
  
  bentoHero: { 
    width: '100%', borderRadius: 26, backgroundColor: '#1C1C1E', marginBottom: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(10, 132, 255, 0.2)',
    shadowColor: '#0A84FF', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }
  },
  bentoHeroBlur: { paddingVertical: 30, paddingHorizontal: 28 },
  bentoHeroInner: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  bentoIconLg: { fontSize: 38 },
  bentoHeroTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', marginBottom: 5, letterSpacing: 0.3 },
  bentoHeroSub: { fontSize: 14, color: '#636366', fontWeight: '500' },

  bentoAsymmGrid: { flexDirection: 'row', width: '100%', gap: 14, marginBottom: 14 },
  bentoTallCard: { 
    flex: 1, borderRadius: 26, backgroundColor: '#1C1C1E', overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)'
  },
  bentoCardInner: { flex: 1, padding: 24, justifyContent: 'center' },
  bentoRightCol: { flex: 1, gap: 14 },
  bentoShortCard: { 
    flex: 1, borderRadius: 26, backgroundColor: '#1C1C1E', overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)'
  },
  
  gridCardIcon: { fontSize: 28 },
  gridCardTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  gridCardSub: { fontSize: 13, color: '#636366', fontWeight: '500' },

  assistantPortal: { 
    width: '100%', borderRadius: 26, overflow: 'hidden', marginBottom: 10,
    shadowColor: '#0A84FF', shadowOpacity: 0.35, shadowRadius: 25, shadowOffset: { width: 0, height: 6 }
  },
  portalTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', marginBottom: 4, letterSpacing: 0.3 },
  portalSub: { fontSize: 14, color: 'rgba(229,241,255,0.8)', fontWeight: '500' },

  // RESULT STYLES
  resultBadge: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 22, borderWidth: 1, marginBottom: 22, width: '100%' },
  resultBadgeText: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center' },
  previewImage: { width: 140, height: 180, borderRadius: 22, marginBottom: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)', resizeMode: 'cover' },
  dataContainer: { width: '100%', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 20 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dataLabel: { color: '#636366', fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  dataValue: { fontSize: 15, fontWeight: '800', color: '#F5F5F7', flexShrink: 1, textAlign: 'right' },
  warningBox: { backgroundColor: 'rgba(255, 69, 58, 0.08)', padding: 18, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,69,58,0.25)', marginTop: 15 },
  warningText: { color: '#FF6961', fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 22 },

  neonDangerBtn: { paddingVertical: 18, width: '100%', borderRadius: 18, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,69,58,0.4)' },
  neonPrimaryBtn: { paddingVertical: 18, width: '100%', borderRadius: 18, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,159,10,0.4)' },
  glassBtn: { paddingVertical: 18, width: '100%', borderRadius: 18, alignItems: 'center', backgroundColor: 'rgba(44,44,46,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.8 },
  ghostButtonText: { color: '#8E8E93', fontSize: 13, fontWeight: '700' },

  cameraOverlay: { alignItems: 'center', paddingVertical: 0 },
  segmentedControl: { flexDirection: 'row', backgroundColor: 'rgba(28,28,30,0.95)', borderRadius: 30, padding: 4, width: 260, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginTop: 40 },
  segmentTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 26 },
  segmentTabActive: { backgroundColor: '#1C1C1E', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10 },
  segmentText: { color: '#636366', fontWeight: '700', fontSize: 13 },
  segmentTextActive: { color: '#fff' },
  scannerFrame: { width: 280, borderWidth: 2, borderRadius: 30, backgroundColor: 'transparent', overflow: 'hidden' },
  laserLine: { width: '100%', height: 3, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 5 },
  
  cameraControls: { flexDirection: 'row', width: '85%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 50 },
  captureButton: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  captureButtonInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#ffffff' },
  glassCircNav: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(28,28,30,0.9)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },

  // MODAL STYLES (BOTTOM SHEET)
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  bottomSheet: { 
    backgroundColor: 'rgba(18,18,18,0.98)', padding: 25, borderTopLeftRadius: 36, borderTopRightRadius: 36, 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderBottomWidth: 0 
  },
  dragHandle: { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginBottom: 22 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#F5F5F7', marginBottom: 20, textAlign: 'center', letterSpacing: 0.3 },
  
  bentoTextInput: { 
    backgroundColor: 'rgba(28,28,30,0.8)', color: '#F5F5F7', padding: 20, borderRadius: 22, 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', minHeight: 140, textAlignVertical: 'top', 
    fontSize: 15, fontWeight: '500', lineHeight: 22
  },
  
  bentoListItem: { 
    backgroundColor: 'rgba(255,255,255,0.03)', padding: 18, borderRadius: 20, marginBottom: 10, 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' 
  },
  historyDate: { color: '#48484A', fontSize: 11, marginBottom: 6, fontWeight: '700', letterSpacing: 1 },
  historyUpi: { color: '#F5F5F7', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  historyReason: { color: '#8E8E93', fontSize: 13, fontWeight: '500' },
  glassPanel: { backgroundColor: 'rgba(28,28,30,0.6)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 14 },
  codeBox: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 18, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,240,255,0.1)', marginBottom: 20 },
  codeText: { color: '#00F0FF', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 22 },
  subText: { fontSize: 13, color: '#8E8E93', textAlign: 'center', marginBottom: 25, lineHeight: 20 }
});
