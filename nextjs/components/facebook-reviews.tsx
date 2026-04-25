"use client";

import { useState, useRef } from "react";

interface ReviewData {
  name: string;
  location: string;
  avatar: string;
  avatarColor: string;
  text: string;
  screenshot: string;
  product: string;
  date: string;
  likes: string;
  comments: string;
  content: string;
}

interface FacebookReviewsProps {
  reviews?: ReviewData[];
  reviewCount?: string;
  rating?: string;
}

const DEFAULT_REVIEWS: ReviewData[] = [
  { name: "Mahir Rahman", location: "Dhaka", avatar: "MR", avatarColor: "linear-gradient(135deg, #4A90E2, #7B68EE)", text: "Amazing quality! Best luggage cover I've ever used.", screenshot: "", product: "World Travel Cover", date: "2 days ago", likes: "24", comments: "5", content: "Amazing quality! Best luggage cover I've ever used." },
  { name: "Sara Islam", location: "Chittagong", avatar: "SI", avatarColor: "linear-gradient(135deg, #40E0D0, #4A90E2)", text: "Love it! Got so many compliments at the airport.", screenshot: "", product: "Beach Breeze Cover", date: "1 week ago", likes: "18", comments: "3", content: "Love it! Got so many compliments at the airport." },
  { name: "Ahmed Khan", location: "Sylhet", avatar: "AK", avatarColor: "linear-gradient(135deg, #7B68EE, #9B59B6)", text: "Great product! Fast delivery and excellent packaging.", screenshot: "", product: "Tokyo Nights Cover", date: "3 days ago", likes: "31", comments: "8", content: "Great product! Fast delivery and excellent packaging." },
  { name: "Tina Rahman", location: "Dhaka", avatar: "TR", avatarColor: "linear-gradient(135deg, #FF6B6B, #FF8E53)", text: "Perfect fit! Looks amazing on my suitcase.", screenshot: "", product: "Floral Dream Cover", date: "5 days ago", likes: "15", comments: "2", content: "Perfect fit! Looks amazing on my suitcase." },
  { name: "Kazi Anis", location: "Chittagong", avatar: "KA", avatarColor: "linear-gradient(135deg, #6BCB77, #4D96FF)", text: "Best purchase ever! Highly recommend.", screenshot: "", product: "Mountain View Cover", date: "1 week ago", likes: "22", comments: "4", content: "Best purchase ever! Highly recommend." },
  { name: "Riya Chowdhury", location: "Sylhet", avatar: "RC", avatarColor: "linear-gradient(135deg, #9B59B6, #E74C3C)", text: "Love the design! Fast shipping too.", screenshot: "", product: "City Lights Cover", date: "4 days ago", likes: "19", comments: "6", content: "Love the design! Fast shipping too." },
];

export function FacebookReviews({ reviews: propReviews, reviewCount, rating }: FacebookReviewsProps) {
  const reviews = propReviews && propReviews.length > 0 ? propReviews : DEFAULT_REVIEWS;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 300);
    }
  };

  const sectionStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #0a0c1a 0%, #1a1f3a 50%, #0d1b2a 100%)',
    padding: '60px 0',
    position: 'relative',
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(24,119,242,0.2)',
    border: '1px solid rgba(24,119,242,0.4)',
    color: '#5b9cf6',
    padding: '6px 18px',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginBottom: '16px',
    letterSpacing: '0.5px',
  };

  return (
    <section style={sectionStyle}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div style={badgeStyle}>
            <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook Reviews
          </div>
          <h2 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>
            Customers Love Us on <span style={{ background: 'linear-gradient(to right, #40E0D0, #4A90E2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Facebook</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>See what our customers post on our Facebook page</p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Left Arrow */}
          <button 
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="fb-nav-btn absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center"
            style={{ left: '-20px', opacity: canScrollLeft ? 1 : 0.3 }}
            aria-label="Previous"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Carousel Scroll */}
          <div 
            ref={scrollRef}
            className="fb-carousel-scroll flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-2"
            onScroll={checkScroll}
            style={{ 
              scrollBehavior: 'smooth',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {reviews.map((review, idx) => (
              <div 
                key={idx} 
                className="fb-review-card shrink-0 snap-center"
                style={{ 
                  minWidth: '280px',
                  maxWidth: '280px',
                }}
              >
                <div className="fb-card-header">
                  <div className="fb-avatar" style={{ background: review.avatarColor }}>
                    {review.avatar}
                  </div>
                  <div className="fb-user-info">
                    <div className="fb-user-name">{review.name}</div>
                    <div className="fb-user-location">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
                      </svg>
                      {review.location}
                    </div>
                  </div>
                  <div className="fb-logo-icon">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                </div>
                <div className="fb-stars">★★★★★</div>
                <p className="fb-review-text">&ldquo;{review.text}&rdquo;</p>
                {/* Screenshot placeholder */}
                <div className="fb-screenshot-placeholder">
                  {review.screenshot ? (
                    <img src={review.screenshot} alt="Facebook post" style={{ width: '100%', borderRadius: '10px' }} />
                  ) : (
                    <div className="fb-screenshot-mock">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button 
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="fb-nav-btn absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center"
            style={{ right: '-20px', opacity: canScrollRight ? 1 : 0.3 }}
            aria-label="Next"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Rating */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
            Based on <strong style={{ color: 'white' }}>{reviewCount || '500+'}</strong> reviews
            <span style={{ margin: '0 8px' }}>•</span>
            <strong style={{ color: '#40E0D0' }}>{rating || '4.9'}</strong> ★ Facebook Rating
          </span>
        </div>
      </div>
    </section>
  );
}