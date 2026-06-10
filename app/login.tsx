import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Keyboard, Animated, Dimensions, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const customStorage = {
  getItem: async (key: string) => { if (Platform.OS === 'web' && typeof window === 'undefined') return null; return await AsyncStorage.getItem(key); },
  setItem: async (key: string, value: string) => { if (Platform.OS === 'web' && typeof window === 'undefined') return; await AsyncStorage.setItem(key, value); },
  removeItem: async (key: string) => { if (Platform.OS === 'web' && typeof window === 'undefined') return; await AsyncStorage.removeItem(key); },
};
const SUPABASE_URL = 'https://yeelfddemddlqktiqhjr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NiafDMZpqWA8VAJ8jaw2sA_aX1--8SG';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { storage: customStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } });

const AnimatedScaleButton = ({ onPress, style, children, disabled }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();

  return (
    <TouchableOpacity activeOpacity={0.9} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} disabled={disabled} style={[{ width: style?.width, marginTop: style?.marginTop }]}>
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }], width: '100%', marginTop: 0 }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function LoginScreen() {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const [isLoginMode, setIsLoginMode] = useState(true);
   const [isRecoveryMode, setIsRecoveryMode] = useState(false);
   const [newPassword, setNewPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);
   const router = useRouter();

   const orb1Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
   const orb2Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

   useEffect(() => {
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
   }, []);

   // LISTEN FOR DEEP LINK SESSION (After Email Confirmation / Password Reset)
   useEffect(() => {
       const handleDeepLink = async (event: { url: string }) => {
           if (event.url) {
               if (event.url.includes('type=recovery')) {
                   setIsRecoveryMode(true);
               }
               const urlToParse = event.url.replace('#', '?');
               const parsed = Linking.parse(urlToParse);
               const queryParams = parsed.queryParams || {};
               
               if (queryParams.access_token && queryParams.refresh_token) {
                    await supabase.auth.setSession({ 
                        access_token: queryParams.access_token as string, 
                        refresh_token: queryParams.refresh_token as string 
                    });
               }
           }
       };

       const subscription = Linking.addEventListener('url', handleDeepLink);
       Linking.getInitialURL().then((url) => { if (url) handleDeepLink({ url }); });

       const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
           if (event === 'PASSWORD_RECOVERY') {
               setIsRecoveryMode(true);
           } else if (event === 'SIGNED_IN' && session && !isRecoveryMode) {
               router.replace('/');
           }
       });

       return () => {
           subscription.remove();
           authListener.subscription.unsubscribe();
       };
   }, [isRecoveryMode]);

   const slideAnim = useRef(new Animated.Value(0)).current;
   const screenWidth = Dimensions.get('window').width;

   const toggleMode = () => {
       const toValue = isLoginMode ? 1 : 0;
       setIsLoginMode(!isLoginMode);
       
       // Clear inputs for security and fresh UX
       setEmail('');
       setPassword('');
       setShowPassword(false);
       
       Haptics.selectionAsync();
       Animated.timing(slideAnim, {
           toValue,
           duration: 400,
           useNativeDriver: true,
       }).start();
   };

   const loginTranslateX = slideAnim.interpolate({
       inputRange: [0, 1],
       outputRange: [0, -600]
   });

   const signupTranslateX = slideAnim.interpolate({
       inputRange: [0, 1],
       outputRange: [600, 0]
   });

   const handleGoogleLogin = async () => {
       setLoading(true);
       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
       try {
           const redirectUrl = Platform.OS === 'web'
               ? (typeof window !== 'undefined' ? window.location.origin + '/login' : 'https://omni-guard-beta.vercel.app/login')
               : Linking.createURL('/login');

           if (Platform.OS === 'web') {
               const { error } = await supabase.auth.signInWithOAuth({
                   provider: 'google',
                   options: {
                       redirectTo: redirectUrl,
                   },
               });
               if (error) throw error;
           } else {
               const { data, error } = await supabase.auth.signInWithOAuth({
                   provider: 'google',
                   options: {
                       redirectTo: redirectUrl,
                       skipBrowserRedirect: true,
                   },
               });

               if (error) throw error;

               if (data?.url) {
                   const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
                   if (result.type === 'success' && result.url) {
                       const urlToParse = result.url.replace('#', '?');
                       const parsed = Linking.parse(urlToParse);
                       const queryParams = parsed.queryParams || {};
                       
                       if (queryParams.error_description) throw new Error(queryParams.error_description as string);
                       
                       const access_token = queryParams.access_token as string;
                       const refresh_token = queryParams.refresh_token as string;

                       if (access_token && refresh_token) {
                           await supabase.auth.setSession({ access_token, refresh_token });
                           router.replace('/');
                       }
                   }
               }
           }
       } catch (error: any) {
           Alert.alert('Google Login Failed', error.message);
       }
       setLoading(false);
   };

    const handleForgotPassword = async () => {
        if (!email) return Alert.alert('Email Required', 'Please enter your email address first to receive a reset link.');
        setLoading(true);
        try {
            const redirectUrl = Linking.createURL('/login');
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });
            if (error) throw error;
            Alert.alert('Reset Link Sent', 'Check your email for a link to reset your password.');
        } catch (error: any) {
            Alert.alert('Reset Failed', error.message);
        }
        setLoading(false);
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters.');
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            Alert.alert('Success', 'Your password has been updated!');
            setIsRecoveryMode(false);
            setNewPassword('');
            router.replace('/');
        } catch (error: any) {
            Alert.alert('Update Failed', error.message);
        }
        setLoading(false);
    };



   const handleAuth = async () => {
       if (!email || !password) return Alert.alert('Error', 'Please enter both email and password.');
       Keyboard.dismiss();
       setLoading(true);
       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

       try {
           if (isLoginMode) {
               const { error } = await supabase.auth.signInWithPassword({ email, password });
               if (error) throw error;
               router.replace('/');
           } else {
               const redirectUrl = Linking.createURL('/login');
               const { error, data } = await supabase.auth.signUp({ 
                   email, 
                   password,
                   options: {
                       emailRedirectTo: redirectUrl
                   }
               });
               if (error) throw error;
               if (data?.session) {
                   router.replace('/');
               } else {
                   Alert.alert('Success!', 'Please check your email to verify your account.');
                   setIsLoginMode(true);
               }
           }
       } catch (error: any) {
           Alert.alert('Authentication Failed', error.message);
       }
       setLoading(false);
   };

    return (
        <View style={styles.container}>
            {/* AMBIENT FLOATING ORBS */}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000' }]}>
                <Animated.View style={[styles.floatingOrb, { backgroundColor: 'rgba(10, 132, 255, 0.25)', top: '10%', left: '10%', transform: orb1Anim.getTranslateTransform() }]} />
                <Animated.View style={[styles.floatingOrb, { backgroundColor: 'rgba(94, 92, 230, 0.25)', bottom: '10%', right: '10%', transform: orb2Anim.getTranslateTransform() }]} />
                <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.formContainer}>
               <View style={{ alignItems: 'center', marginBottom: 40 }}>
                   <Ionicons name="shield-checkmark" size={64} color="#0A84FF" style={{ marginBottom: 15 }} />
                   <Text style={styles.title}>OmniGuard</Text>
                   <Text style={styles.subtitle}>Decentralized Threat Intelligence</Text>
               </View>

               <View style={{ width: '100%', maxWidth: 400, height: isRecoveryMode ? 280 : 480, flexDirection: 'row', overflow: 'hidden' }}>
                   {isRecoveryMode ? (
                       <Animated.View style={[StyleSheet.absoluteFill]}>
                           <View style={styles.glassCard}>
                               <Text style={styles.cardHeader}>RESET PASSWORD</Text>
                               <View style={styles.inputWrapper}>
                                   <Ionicons name="lock-closed" size={20} color="#8E8E93" style={styles.inputIcon} />
                                   <TextInput style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} placeholder="Enter new password" placeholderTextColor="#8E8E93" value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showPassword} />
                                   <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
                                       <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#8E8E93" />
                                   </TouchableOpacity>
                               </View>
                               <AnimatedScaleButton style={styles.primaryButton} onPress={handleUpdatePassword} disabled={loading}>
                                   {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>UPDATE PASSWORD</Text>}
                               </AnimatedScaleButton>
                           </View>
                       </Animated.View>
                   ) : (
                       <>
                           {/* LOGIN CARD */}
                           <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: loginTranslateX }] }]}>
                       <View style={styles.glassCard}>
                           <Text style={styles.cardHeader}>MEMBER LOGIN</Text>
                           <View style={styles.inputWrapper}>
                               <Ionicons name="mail" size={20} color="#8E8E93" style={styles.inputIcon} />
                               <TextInput style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} placeholder="Email Address" placeholderTextColor="#8E8E93" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                           </View>
                           <View style={styles.inputWrapper}>
                               <Ionicons name="lock-closed" size={20} color="#8E8E93" style={styles.inputIcon} />
                               <TextInput style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} placeholder="Password" placeholderTextColor="#8E8E93" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                               <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
                                   <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#8E8E93" />
                               </TouchableOpacity>
                           </View>
                            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 20, marginTop: -5 }} onPress={handleForgotPassword}>
                                <Text style={{ color: '#8E8E93', fontSize: 13, fontWeight: '500' }}>Forgot Password?</Text>
                            </TouchableOpacity>
                           <AnimatedScaleButton style={styles.primaryButton} onPress={handleAuth} disabled={loading}>
                               {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>AUTHENTICATE</Text>}
                           </AnimatedScaleButton>

                           <View style={styles.divider}>
                               <View style={styles.dividerLine} />
                               <Text style={styles.dividerText}>OR</Text>
                               <View style={styles.dividerLine} />
                           </View>

                           <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                               <Ionicons name="logo-google" size={18} color="#fff" style={{ marginRight: 10 }} />
                               <Text style={styles.googleButtonText}>Continue with Google</Text>
                           </TouchableOpacity>

                           <TouchableOpacity style={{ marginTop: 20 }} onPress={toggleMode}>
                               <Text style={styles.toggleText}>
                                   Don't have an account? <Text style={{ color: '#0A84FF', fontWeight: 'bold' }}>Sign up here</Text>
                               </Text>
                           </TouchableOpacity>
                       </View>
                   </Animated.View>

                   {/* SIGNUP CARD */}
                   <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: signupTranslateX }] }]}>
                       <View style={styles.glassCard}>
                           <Text style={styles.cardHeader}>CREATE ACCOUNT</Text>
                           <View style={styles.inputWrapper}>
                               <Ionicons name="mail" size={20} color="#8E8E93" style={styles.inputIcon} />
                               <TextInput style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} placeholder="Email Address" placeholderTextColor="#8E8E93" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                           </View>
                           <View style={styles.inputWrapper}>
                               <Ionicons name="lock-closed" size={20} color="#8E8E93" style={styles.inputIcon} />
                               <TextInput style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]} placeholder="Password" placeholderTextColor="#8E8E93" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                               <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
                                   <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#8E8E93" />
                               </TouchableOpacity>
                           </View>
                           <AnimatedScaleButton style={styles.primaryButton} onPress={handleAuth} disabled={loading}>
                               {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>REGISTER</Text>}
                           </AnimatedScaleButton>

                           <View style={styles.divider}>
                               <View style={styles.dividerLine} />
                               <Text style={styles.dividerText}>OR</Text>
                               <View style={styles.dividerLine} />
                           </View>

                           <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                               <Ionicons name="logo-google" size={18} color="#fff" style={{ marginRight: 10 }} />
                               <Text style={styles.googleButtonText}>Continue with Google</Text>
                           </TouchableOpacity>

                           <TouchableOpacity style={{ marginTop: 20 }} onPress={toggleMode}>
                               <Text style={styles.toggleText}>
                                   Already registered? <Text style={{ color: '#0A84FF', fontWeight: 'bold' }}>Login here</Text>
                               </Text>
                           </TouchableOpacity>
                       </View>
                   </Animated.View>
                       </>
                   )}
               </View>
            </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    floatingOrb: { position: 'absolute', width: 400, height: 400, borderRadius: 200 },
    formContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
    subtitle: { fontSize: 14, color: '#8E8E93', fontWeight: '400', marginTop: 5 },
    glassCard: { width: '100%', maxWidth: 400, borderRadius: 22, padding: 30, backgroundColor: '#1C1C1E', overflow: 'hidden', alignItems: 'center' },
    cardHeader: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 1, marginBottom: 25 },
    inputWrapper: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', borderRadius: 16, marginBottom: 15, paddingHorizontal: 15 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: '#FFFFFF', paddingVertical: 18, fontSize: 16 },
    primaryButton: { width: '100%', height: 56, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginTop: 10, backgroundColor: '#0A84FF' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    toggleText: { color: '#8E8E93', fontSize: 14 },
    googleButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginTop: 5
    },
    googleButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 15, width: '100%' },
    dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    dividerText: { color: 'rgba(255,255,255,0.3)', marginHorizontal: 15, fontSize: 12, fontWeight: '700' }
});
