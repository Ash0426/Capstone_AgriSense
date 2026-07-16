// app/automation.tsx
// Full automation switch list, pushed from the "View More" button on the dashboard.
// Wire each toggle's onValueChange to POST the new state to your backend / ESP32 controller.
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '../constants/theme';
import { automationSwitches, SwitchKey } from '../data/mockData';
import Card from '../components/ui/Card';
import ScreenHeader from '../components/ui/ScreenHeader';
import ListItem from '../components/ui/ListItem';
import ToggleSwitch from '../components/ui/ToggleSwitch';

export default function AutomationScreen() {
  const [switches, setSwitches] = useState(
    Object.fromEntries(automationSwitches.map((s) => [s.key, s.value])) as Record<SwitchKey, boolean>
  );

  const toggle = (key: SwitchKey) => {
    setSwitches((prev) => ({ ...prev, [key]: !prev[key] }));
    // TODO: POST { switch: key, value: !switches[key] } to your backend here
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <ScreenHeader title="Automation Override" subtitle="Manually control switches on your farm" showBack />
      <Card>
        <View style={styles.body}>
          {automationSwitches.map((item, i) => (
            <ListItem
              key={item.key}
              icon={item.icon as any}
              iconBg={item.iconBg}
              title={item.title}
              desc={item.desc}
              noBorder={i === automationSwitches.length - 1}
              right={<ToggleSwitch value={switches[item.key]} onValueChange={() => toggle(item.key)} />}
            />
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  body: { paddingHorizontal: spacing.lg },
});
