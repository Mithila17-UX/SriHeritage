import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ArrowRight, Users, MessageCircle, Heart, Share2 } from 'lucide-react';

interface CommunityScreenProps {
  onNext: () => void;
  onSkip: () => void;
}

export function CommunityScreen({ onNext, onSkip }: CommunityScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Progress value={75} className="flex-1 mr-4" />
            <Button variant="ghost" size="sm" onClick={onSkip} className="text-gray-500">
              Skip
            </Button>
          </div>

          {/* Feature Illustration */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-6 mb-6 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <Users className="text-white" size={32} />
                </div>
              </div>
              
              {/* Forum Post Mock */}
              <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">SJ</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm">Sarah</span>
                      <span className="text-xs text-gray-500">2h ago</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Just visited Sigiriya! The climb was challenging but the views were absolutely worth it. Don't forget to bring water! 🏔️
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-xs text-gray-500">
                      <Heart size={12} />
                      <span>12</span>
                    </button>
                    <button className="flex items-center space-x-1 text-xs text-gray-500">
                      <MessageCircle size={12} />
                      <span>5</span>
                    </button>
                  </div>
                  <button className="text-xs text-gray-500">
                    <Share2 size={12} />
                  </button>
                </div>
              </div>
              
              {/* Second Post Preview */}
              <div className="bg-white/70 rounded-lg p-3 mt-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">RP</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-600">Ravi shared a photo from Galle Fort...</span>
                </div>
              </div>
            </div>
            
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/30 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-200/30 rounded-full translate-y-8 -translate-x-8"></div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Join Our Community Forum</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Connect with fellow heritage enthusiasts, share your experiences, get travel tips, and discover hidden gems through our vibrant community.
            </p>
            
            {/* Features List */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <span>Share travel experiences</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <span>Get insider tips from locals</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <span>Ask questions & help others</span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={onNext}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg"
          >
            Continue
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}