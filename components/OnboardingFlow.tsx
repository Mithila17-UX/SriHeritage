import React, { useState } from 'react';
import { WelcomeScreen } from './onboarding/WelcomeScreen';
import { MapFeatureScreen } from './onboarding/MapFeatureScreen';
import { SiteInfoScreen } from './onboarding/SiteInfoScreen';
import { CommunityScreen } from './onboarding/CommunityScreen';
import { ReadyToExploreScreen } from './onboarding/ReadyToExploreScreen';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  switch (currentStep) {
    case 0:
      return <WelcomeScreen onNext={handleNext} onSkip={handleSkip} />;
    case 1:
      return <MapFeatureScreen onNext={handleNext} onSkip={handleSkip} />;
    case 2:
      return <SiteInfoScreen onNext={handleNext} onSkip={handleSkip} />;
    case 3:
      return <CommunityScreen onNext={handleNext} onSkip={handleSkip} />;
    case 4:
      return <ReadyToExploreScreen onStartExploring={onComplete} onSkip={handleSkip} />;
    default:
      return <WelcomeScreen onNext={handleNext} onSkip={handleSkip} />;
  }
}