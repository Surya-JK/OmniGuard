import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Import the JSON reports
import seleniumResults from '../tests/selenium/reports/selenium_results.json';
import appiumResults from '../tests/appium/reports/appium_results.json';

export default function ReportsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'selenium' | 'appium'>('selenium');

  const activeResults = activeTab === 'selenium' ? seleniumResults : appiumResults;
  const totalTests = activeResults.length;
  const passedTests = activeResults.filter((t: any) => t.outcome === 'PASSED').length;
  const failedTests = activeResults.filter((t: any) => t.outcome === 'FAILED').length;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0A84FF" />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>E2E Test Reports</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'selenium' && styles.activeTab]} 
          onPress={() => { Haptics.selectionAsync(); setActiveTab('selenium'); }}
        >
          <Ionicons name="globe-outline" size={18} color={activeTab === 'selenium' ? '#fff' : '#636366'} style={{marginRight: 6}} />
          <Text style={[styles.tabText, activeTab === 'selenium' && styles.activeTabText]}>Web (Selenium)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'appium' && styles.activeTab]} 
          onPress={() => { Haptics.selectionAsync(); setActiveTab('appium'); }}
        >
          <Ionicons name="phone-portrait-outline" size={18} color={activeTab === 'appium' ? '#fff' : '#636366'} style={{marginRight: 6}} />
          <Text style={[styles.tabText, activeTab === 'appium' && styles.activeTabText]}>Mobile (Appium)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsRow}>
        <BlurView intensity={30} tint="dark" style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Tests</Text>
          <Text style={[styles.metricValue, {color: '#00F0FF'}]}>{totalTests}</Text>
        </BlurView>
        <BlurView intensity={30} tint="dark" style={styles.metricCard}>
          <Text style={styles.metricLabel}>Passed</Text>
          <Text style={[styles.metricValue, {color: '#00FF9D'}]}>{passedTests}</Text>
        </BlurView>
        <BlurView intensity={30} tint="dark" style={styles.metricCard}>
          <Text style={styles.metricLabel}>Failed</Text>
          <Text style={[styles.metricValue, {color: '#EF4444'}]}>{failedTests}</Text>
        </BlurView>
        <BlurView intensity={30} tint="dark" style={styles.metricCard}>
          <Text style={styles.metricLabel}>Pass Rate</Text>
          <Text style={[styles.metricValue, {color: passRate > 80 ? '#00FF9D' : '#FCD34D'}]}>{passRate}%</Text>
        </BlurView>
      </View>

      <ScrollView style={styles.resultsList} contentContainerStyle={{paddingBottom: 40}}>
        {activeResults.map((test: any, index: number) => (
          <View key={index} style={[styles.testItem, {borderColor: test.outcome === 'PASSED' ? 'rgba(0, 255, 157, 0.2)' : 'rgba(239, 68, 68, 0.2)'}]}>
            <View style={styles.testHeader}>
              <View style={styles.testTitleContainer}>
                <Ionicons 
                  name={test.outcome === 'PASSED' ? "checkmark-circle" : "close-circle"} 
                  size={20} 
                  color={test.outcome === 'PASSED' ? '#00FF9D' : '#EF4444'} 
                  style={{marginRight: 8}}
                />
                <Text style={styles.testNodeId} numberOfLines={2}>{test.nodeid.split(' | ')[1] || test.nodeid}</Text>
              </View>
              <Text style={styles.testDuration}>{test.duration.toFixed(2)}s</Text>
            </View>
            
            {test.outcome === 'FAILED' && test.longrepr ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText} numberOfLines={4}>{test.longrepr}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050B14' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'ios' ? 10 : 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20, backgroundColor: 'rgba(28,28,30,0.8)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  backText: { color: '#0A84FF', fontSize: 15, fontWeight: '600', marginLeft: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, backgroundColor: '#1C1C1E', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  activeTab: { backgroundColor: '#2C2C2E', borderColor: 'rgba(10, 132, 255, 0.3)' },
  tabText: { color: '#636366', fontWeight: '700', fontSize: 14 },
  activeTabText: { color: '#FFF' },

  metricsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  metricCard: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  metricLabel: { color: '#8E8E93', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginBottom: 8 },
  metricValue: { fontSize: 22, fontWeight: '800' },

  resultsList: { flex: 1, paddingHorizontal: 20 },
  testItem: { backgroundColor: 'rgba(28,28,30,0.6)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  testHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  testTitleContainer: { flexDirection: 'row', flex: 1, paddingRight: 10 },
  testNodeId: { color: '#E5E5EA', fontSize: 14, fontWeight: '600', flexShrink: 1, lineHeight: 20 },
  testDuration: { color: '#636366', fontSize: 12, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  errorBox: { marginTop: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  errorText: { color: '#FCA5A5', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }
});
