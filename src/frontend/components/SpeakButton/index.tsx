import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { IconButton } from 'react-native-paper';
import { Style } from './style';

/**
 * This file renders a button that speaks the given text when pressed.
 *
 * You can stop the speaking by button toggle
 * The text to be read will be modified not to contain any urls.
 */

export function SpeakButton(props: { response: string }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Function to remove links from the text
  function extractReadableText(response: string): string {
    // Regular expression to match http and https and www links
    const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    // Remove links from the text
    return response.replace(linkRegex, '');
  }

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // if button is pressed
  const handleSpeech = () => {
    if (isSpeaking) {
      setIsSpeaking(false);
      Speech.stop();
    } else {
      setIsSpeaking(true);
      const readableText = extractReadableText(props.response);
      Speech.speak(readableText, {
        language: 'en-US',
        pitch: 1,
        rate: 1,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
    }
  };

  return (
    <IconButton
      icon={!isSpeaking ? 'volume-up' : 'volume-mute'}
      size={16}
      onPress={handleSpeech}
      style={Style.speakButton}
    />
  );
}