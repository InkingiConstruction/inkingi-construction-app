import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { COLORS } from '@/constants/colors';

interface OTPInputProps {
  code: string;
  setCode: (code: string) => void;
  length?: number;
}

export default function OTPInput({ code, setCode, length = 6 }: OTPInputProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChangeText = (text: string, index: number) => {
    const codeArr = code.split('');
    // Take only the last character entered
    codeArr[index] = text.slice(-1);
    const newCode = codeArr.join('');
    setCode(newCode);

    // Auto-focus next input
    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const codeArr = code.split('');
      if (!codeArr[index] && index > 0) {
        // Focus previous input if current is empty
        inputs.current[index - 1]?.focus();
        codeArr[index - 1] = '';
        setCode(codeArr.join(''));
      }
    }
  };

  const codeArray = code.padEnd(length, ' ').split('').slice(0, length);

  return (
    <View style={styles.container}>
      {codeArray.map((char, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputs.current[index] = ref;
          }}
          style={[
            styles.input,
            focusedIndex === index && styles.inputFocused,
            char.trim() !== '' && styles.inputFilled,
          ]}
          keyboardType="number-pad"
          maxLength={1}
          value={char.trim()}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 54,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputFocused: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.SURFACE,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  inputFilled: {
    borderColor: COLORS.PRIMARY_DARK,
    color: COLORS.PRIMARY_DARK,
  },
});
