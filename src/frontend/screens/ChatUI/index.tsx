import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Voice, {
  type SpeechResultsEvent,
  type SpeechStartEvent,
  type SpeechRecognizedEvent
} from '@react-native-voice/voice';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import * as Speech from 'expo-speech';
import { signOut } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import React from 'react';
import { useCallback, useState } from 'react';
import { useEffect, useRef } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Keyboard } from 'react-native';
import { Vibration } from 'react-native';
import { ActivityIndicator, IconButton } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useAuth } from 'reactfire';
import { Screens } from 'src/frontend/helpers';
import { useActiveChatId, useGetAllChat, useGetChat, useUpdateChat } from 'src/frontend/hooks';
import type { AppRoutesParams } from 'src/frontend/routes';
import type { MainDrawerParams } from 'src/frontend/routes/MainRoutes';
import type { Chat } from 'src/frontend/types';
import {
  useGetAllChat,
  useUpdateChat,
  useGetChat,
  useActiveChatId,
  useCreateChat,
  LLM_MODELS
} from 'src/frontend/hooks';
import { Timestamp } from 'firebase/firestore';
import { ActivityIndicator, IconButton } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { styles } from './style';

export type ChatUiProps = {
  chatId: string;
};

export function ChatUI(/*props: ChatUiProps*/) {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const { createChat, isCreating } = useCreateChat();
  // ------------- Render Chat from firebase -------------
  const { activeChatId, setActiveChatId } = useActiveChatId();
  const { chat, status, error } = useGetChat(activeChatId);
  const [isRecording, setIsRecording] = useState(false); // Added state for button color
  //console.log("chatId: ", activeChatId)


  useEffect(() => {
    renderMessages();
  }, [chat?.conversation.length, activeChatId]);

  const renderMessages = () => {
    if (status === 'loading' || isCreating) return <ActivityIndicator />;

    if (chat === undefined)
      //TODO: This is Work in Progress
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16 }}> Write a message to begin. </Text>
        </View>
      );

    let i = 0;
    return chat?.conversation.map((message, index) => (
      <View
        key={chat.id + (i++).toString()}
        style={[
          styles.message,
          index % 2 === 0
            ? [styles.sentMessage, { backgroundColor: colors.inversePrimary }]
            : [styles.receivedMessage, { backgroundColor: colors.surfaceVariant }]
        ]}
      >
        {index % 2 !== 1 && (
          <IconButton
            icon='volume-up'
            size={16}
            onPress={() =>
              Speech.speak(message, {
                language: 'en-US',
                pitch: 1,
                rate: 1
              })
            }
            style={styles.speakButton}
          />
        )}
        <Text>{message}</Text>
      </View>
    ));
  };
  // ------------- End render Chat from firebase -------------

  // ------------- Sending new message to firebase -------------

  const [text, setText] = useState('');
  const { updateChat, isUpdating, error: updateError } = useUpdateChat(chat?.id || '');

  function sendMessage() {
    // Create new Chat
    if (chat === undefined && text.trim()) {
      setText('');
      const newChat: Chat = {
        title: text,
        model: [LLM_MODELS[0].key],
        conversation: [text],
        createdAt: Timestamp.now()
      };
      const newId = createChat(newChat);
      newId.then((newId) => {
        setActiveChatId(newId || 'default');
      });
      status = 'loading';
      renderMessages();
      // Send Message in Current Chat
    } else if (chat?.id && text.trim()) {
      chat?.conversation.push(text);
      setText('');
      updateChat({
        conversation: chat?.conversation
      }).catch((error) => {
        console.error('Error updating chat:', error);
      });
    }
  }

  // ------------- End sending new message to firebase -------------

  // ------------- Keyboard and scrolling -------------

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [chat?.conversation.length]);

  // ------------- End keyboard and scrolling -------------

  // ------------- Voice Recognition Setup -------------
  const [recognized, setRecognized] = useState('');
  const [started, setStarted] = useState('');
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechResults = onSpeechResults;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = (e: SpeechStartEvent) => {
    setStarted('√');
  };

  const onSpeechRecognized = (e: SpeechRecognizedEvent) => {
    setRecognized('√');
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    setResults(e.value ?? []);
    setText(e.value?.[0] ?? '');
  };

  const startRecognition = async () => {
    setIsRecording(true); // Set recording state to true
    Vibration.vibrate(50); // Vibrate for 50 milliseconds on press

    setRecognized('');
    setStarted('');
    setResults([]);
    try {
      await Voice.start('en-US');
    } catch (e) {
      console.error(e);
      setIsRecording(false); // Reset recording state on error
    }
  };

  const stopRecognition = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
    Vibration.vibrate(50); // Vibrate for 50 milliseconds on release
    setIsRecording(false); // Reset recording state
  };

  // ------------- End Voice Recognition Setup -------------
  // ------------- Conditional Rendering of Voice/Send Button -------------

  // ------------- Conditional Rendering of Voice/Send Button -------------

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.chatContainer}
        contentContainerStyle={styles.scrollViewContent}
        ref={scrollViewRef}
      >
        {renderMessages()}
      </ScrollView>
      <View style={[styles.inputContainer, { borderColor: colors.outlineVariant }]}>
        <TextInput
          style={[styles.input, { borderColor: colors.outlineVariant }]}
          placeholder='Write something here...'
          value={text}
          onChangeText={(text) => setText(text)}
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        {text.trim() ? (
          <IconButton
            icon='paper-plane'
            onPress={sendMessage}
            onPressOut={stopRecognition}
            iconColor={colors.onPrimary}
            containerColor={colors.primary}
            style={{ marginHorizontal: 5, paddingRight: 3 }}
          />
        ) : (
          <IconButton
            icon='microphone'
            onPressIn={startRecognition}
            onPressOut={stopRecognition}
            iconColor={colors.onPrimary}
            containerColor={isRecording ? colors.inversePrimary : colors.primary}
            style={{ marginHorizontal: 5 }}
          />
        )}
      </View>
    </View>
  );
}
