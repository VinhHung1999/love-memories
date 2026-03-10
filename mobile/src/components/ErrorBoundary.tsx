import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary] JS crash caught:', {
      message: error.message,
      componentStack: info.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        {/* Icon */}
        <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
          <Icon name="heart-broken" size={36} color="#E8788A" />
        </View>

        {/* Heading */}
        <Text className="text-xl font-bold text-textDark text-center mb-2">
          Something went wrong
        </Text>
        <Text className="text-sm text-textLight text-center leading-relaxed mb-8">
          An unexpected error occurred. Your data is safe — tap below to try again.
        </Text>

        {/* Try Again */}
        <Pressable
          onPress={this.handleReset}
          className="w-full rounded-2xl py-4 items-center bg-primary mb-3">
          <Text className="text-white font-bold text-[15px]">Try Again</Text>
        </Pressable>
      </View>
    );
  }
}
