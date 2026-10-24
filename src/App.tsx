import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { FarmAccountView } from './components/FarmAccountView';
import { HealthAccountView } from './components/HealthAccountView';
import { PreviewModal } from './components/PreviewModal';
import { Toast } from './components/Toast';
import { ImageModal } from './components/ImageModal';
import { PwaBanner } from './components/PwaBanner';

export const App: React.FC = () => {
  // Navigation view: 'home' | 'farm' | 'health'
  const [currentView, setCurrentView] = useState<'home' | 'farm' | 'health'>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('farm')) return 'farm';
    if (hash.includes('health')) return 'health';
    return 'home';
  });

  // Modal preview
  const [previewType, setPreviewType] = useState<'farm' | 'health' | null>(null);

  // Image lightbox
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; icon?: string }>({
    show: false,
    message: ''
  });

  const showToast = (message: string, icon?: string) => {
    setToast({ show: true, message, icon });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3200);
  };

  // Sync with browser hash / back button
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('farm')) setCurrentView('farm');
      else if (hash.includes('health')) setCurrentView('health');
      else setCurrentView('home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: 'home' | 'farm' | 'health') => {
    setCurrentView(view);
    if (view === 'home') {
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.hash = view;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // PWA install prompt handler
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      showToast('ติดตั้งแอปสำเร็จเรียบร้อยแล้ว!');
    });

    // Register service worker if available
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('SW registration failed:', err);
        });
      });
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().catch(() => {});
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setCanInstall(false);
      });
    } else {
      const isIOS =
        /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isIOS) {
        alert(
          'ติดตั้งบน iPhone / iPad:\n1) เปิดหน้านี้ด้วย Safari\n2) แตะปุ่มแชร์ (สี่เหลี่ยมมีลูกศรขึ้น)\n3) เลือก "เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)'
        );
      } else {
        alert('คุณสามารถติดตั้งแอพได้จากเมนูตัวเลือกของเบราว์เซอร์ (Add to Home screen)');
      }
    }
  };

  // Close modals on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeImageUrl) setActiveImageUrl(null);
        else if (previewType) setPreviewType(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImageUrl, previewType]);

  return (
    <div className="font-sarabun text-stone-800 antialiased min-h-screen flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      <Toast show={toast.show} message={toast.message} icon={toast.icon} />

      {/* Image Modal Lightbox */}
      <ImageModal imageUrl={activeImageUrl} onClose={() => setActiveImageUrl(null)} />

      {/* Preview Modal for Farm or Health */}
      <PreviewModal
        type={previewType}
        onClose={() => setPreviewType(null)}
        onOpenFull={(type) => {
          setPreviewType(null);
          navigateTo(type);
        }}
        onShowToast={showToast}
        onOpenImageModal={(url) => setActiveImageUrl(url)}
      />

      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        onOpenPreview={(type) => setPreviewType(type)}
        canInstall={canInstall}
        onInstall={triggerInstall}
      />

      {/* View Switcher */}
      {currentView === 'home' && (
        <HomeView
          onNavigate={navigateTo}
          onOpenPreview={(type) => setPreviewType(type)}
          canInstall={canInstall}
          onInstall={triggerInstall}
        />
      )}

      {currentView === 'farm' && (
        <FarmAccountView
          onShowToast={showToast}
          onOpenImageModal={(url) => setActiveImageUrl(url)}
          onNavigateHome={() => navigateTo('home')}
        />
      )}

      {currentView === 'health' && (
        <HealthAccountView
          onShowToast={showToast}
          onOpenImageModal={(url) => setActiveImageUrl(url)}
          onNavigateHome={() => navigateTo('home')}
        />
      )}

      {/* Floating PWA Status & Install Banner */}
      <PwaBanner onInstall={triggerInstall} canInstall={canInstall} />
    </div>
  );
};

export default App;
