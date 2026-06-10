import React, { useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Platform, Linking, Alert, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const customStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return null;
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    await AsyncStorage.removeItem(key);
  },
};

const SUPABASE_URL = 'https://yeelfddemddlqktiqhjr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NiafDMZpqWA8VAJ8jaw2sA_aX1--8SG';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: customStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

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

export default function PremiumScreen() {
    const router = useRouter();

    const [isVerifying, setIsVerifying] = React.useState(false);

    const handleUpgrade = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // PASTE YOUR REAL RAZORPAY LINK HERE!
        const RAZORPAY_LINK = "https://rzp.io/rzp/HqxFPwHU"; 

        try {
            await Linking.openURL(RAZORPAY_LINK);
            // After opening the link, show the verify button
            setIsVerifying(true);
        } catch (e) {
            Alert.alert("Error", "Could not open the payment gateway.");
        }
    };

    const verifyAndUnlock = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        const unlockProInDatabase = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const oneMonthFromNow = new Date();
                    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
                    
                    await supabase.from('profiles').upsert({
                        id: session.user.id,
                        email: session.user.email,
                        is_pro: true,
                        pro_expires_at: oneMonthFromNow.toISOString()
                    });
                }
            } catch (e) {
                console.error("Failed to unlock PRO:", e);
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Did you complete the payment on the website?");
            if (confirmed) {
                await unlockProInDatabase();
                window.alert("Success! Your account is now PRO. Enjoy unlimited scans!");
                router.replace('/'); 
            }
        } else {
            Alert.alert(
                "Payment Verification",
                "Did you complete the payment on the website?",
                [
                    { text: "Not yet", style: "cancel" },
                    { 
                        text: "Yes, I paid", 
                        onPress: async () => {
                            await unlockProInDatabase();
                            Alert.alert("Success!", "Your account is now PRO. Enjoy unlimited scans!");
                            router.replace('/'); 
                        } 
                    }
                ]
            );
        }
    };

    return (
        <View style={styles.container}>
            {/* LUXURY BACKGROUND */}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000' }]}>
                <View style={styles.auroraOrb1} />
                <View style={styles.auroraOrb2} />
                <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
            </View>

            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <PressBtn onPress={() => { Haptics.impactAsync(); router.back(); }} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
                    </PressBtn>
                    <Text style={styles.headerTitle}>Upgrade to PRO</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.iconContainer}>
                        <Ionicons name="diamond" size={80} color="#FBBF24" />
                    </View>

                    <Text style={styles.title}>OmniGuard <Text style={{ color: '#FBBF24' }}>PRO</Text></Text>
                    <Text style={styles.subtitle}>Unlock the ultimate decentralized threat intelligence platform. Secure your entire digital life.</Text>

                    <BlurView intensity={40} tint="dark" style={styles.pricingCard}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceSymbol}>$</Text>
                            <Text style={styles.priceAmount}>3.99</Text>
                            <Text style={styles.pricePeriod}>/mo</Text>
                        </View>
                        <Text style={styles.billingText}>Billed monthly. Cancel anytime.</Text>
                        
                        <View style={styles.divider} />

                        <View style={styles.featureList}>
                            <FeatureItem icon="infinite" title="Unlimited AI Threat Scans" desc="Bypass the 50 scans/day free limit." />
                            <FeatureItem icon="chatbubbles" title="Unlimited Forensic Chat" desc="Ask the AI agent unlimited questions." />
                            <FeatureItem icon="cloud-done" title="Priority Cloud Sync" desc="Your Vault is backed up securely forever." />
                            <FeatureItem icon="shield-checkmark" title="Zero-Day Protection" desc="Access to live VirusTotal API databases." />
                        </View>

                        {!isVerifying ? (
                            <PressBtn style={styles.upgradeButton} onPress={handleUpgrade}>
                                <LinearGradient colors={['#FBBF24', '#D97706']} style={StyleSheet.absoluteFillObject} start={{x: 0, y: 0}} end={{x: 1, y: 1}} />
                                <Text style={styles.upgradeButtonText}>UPGRADE NOW</Text>
                                <Ionicons name="sparkles" size={18} color="#fff" style={{ marginLeft: 8 }} />
                            </PressBtn>
                        ) : (
                            <PressBtn style={[styles.upgradeButton, { backgroundColor: '#10B981' }]} onPress={verifyAndUnlock}>
                                <Text style={styles.upgradeButtonText}>VERIFY PAYMENT</Text>
                                <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginLeft: 8 }} />
                            </PressBtn>
                        )}
                    </BlurView>
                    
                    <Text style={styles.footerText}>By upgrading, you agree to our Terms of Service and Privacy Policy.</Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const FeatureItem = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <View style={styles.featureItem}>
        <View style={styles.featureIconBox}>
            <Ionicons name={icon} size={20} color="#FBBF24" />
        </View>
        <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDesc}>{desc}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    auroraOrb1: { position: 'absolute', top: '-10%', left: '-20%', width: 450, height: 450, borderRadius: 225, backgroundColor: '#FBBF24', opacity: 0.15 },
    auroraOrb2: { position: 'absolute', bottom: '-10%', right: '-20%', width: 450, height: 450, borderRadius: 225, backgroundColor: '#7C3AED', opacity: 0.2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 10 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#F5F5F7', letterSpacing: 0.5 },
    scrollContent: { alignItems: 'center', padding: 20, paddingBottom: 60 },
    iconContainer: { marginTop: 20, marginBottom: 15, shadowColor: '#FBBF24', shadowOpacity: 1, shadowRadius: 40, shadowOffset: { width: 0, height: 0 } },
    title: { fontSize: 36, fontWeight: '900', color: '#F5F5F7', letterSpacing: 0.5, marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#636366', textAlign: 'center', lineHeight: 26, paddingHorizontal: 10, marginBottom: 30 },
    pricingCard: { width: '100%', maxWidth: 450, borderRadius: 32, padding: 30, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.2)', overflow: 'hidden', backgroundColor: 'rgba(28,28,30,0.6)' },
    priceRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline' },
    priceSymbol: { fontSize: 24, fontWeight: '700', color: '#F5F5F7', marginRight: 4 },
    priceAmount: { fontSize: 60, fontWeight: '900', color: '#F5F5F7' },
    pricePeriod: { fontSize: 18, color: '#636366', marginLeft: 4, fontWeight: '600' },
    billingText: { textAlign: 'center', color: '#48484A', fontSize: 14, marginTop: 5, marginBottom: 25 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', width: '100%', marginBottom: 25 },
    featureList: { marginBottom: 30 },
    featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
    featureIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(251, 191, 36, 0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.15)' },
    featureTextContainer: { flex: 1 },
    featureTitle: { color: '#F5F5F7', fontSize: 16, fontWeight: '700', marginBottom: 4 },
    featureDesc: { color: '#636366', fontSize: 13, lineHeight: 18 },
    upgradeButton: { width: '100%', height: 60, borderRadius: 22, overflow: 'hidden', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    upgradeButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '900', letterSpacing: 1.5 },
    footerText: { marginTop: 30, color: '#3A3A3C', fontSize: 12, textAlign: 'center', paddingHorizontal: 40 }
});
