import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, Camera, Utensils, Target, MapPin, ArrowRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { momentsApi, foodSpotsApi, sprintsApi } from '../lib/api';
import RelationshipTimer from '../components/RelationshipTimer';
import FAB from '../components/FAB';

export default function Dashboard() {
  const { data: moments = [] } = useQuery({ queryKey: ['moments'], queryFn: momentsApi.list });
  const { data: foodSpots = [] } = useQuery({ queryKey: ['foodspots'], queryFn: foodSpotsApi.list });
  const { data: sprints = [] } = useQuery({ queryKey: ['sprints'], queryFn: sprintsApi.list });

  const activeSprint = sprints.find((s) => s.status === 'ACTIVE');
  const recentMoments = moments.slice(0, 6);
  const doneGoals = activeSprint?.goals.filter((g) => g.status === 'DONE').length || 0;
  const totalGoals = activeSprint?.goals.length || 0;
  const sprintProgress = totalGoals > 0 ? Math.round((doneGoals / totalGoals) * 100) : 0;

  const stats = [
    { icon: Camera, label: 'Moments', value: moments.length, color: 'bg-primary/10 text-primary', to: '/moments' },
    { icon: Utensils, label: 'Food Spots', value: foodSpots.length, color: 'bg-secondary/10 text-secondary', to: '/foodspots' },
    { icon: MapPin, label: 'Places', value: moments.filter(m => m.latitude).length + foodSpots.filter(f => f.latitude).length, color: 'bg-accent/10 text-accent', to: '/map' },
    { icon: Target, label: 'Goals Done', value: doneGoals, color: 'bg-purple-100 text-purple-600', to: '/goals' },
  ];


  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <h1 className="font-heading text-3xl font-bold">Love Scrum</h1>
        </div>
        <p className="text-text-light text-sm">Our little world, beautifully organized</p>
      </div>

      {/* Timer inline — compact, above hero */}
      <div className="mb-3 px-0.5">
        <RelationshipTimer />
      </div>

      {/* ── RECENT MOMENTS (Swiper) ───────────────────────────────────── */}
      <div className="mb-2 -mx-4 md:mx-0">
        {recentMoments.length === 0 ? (
          <div className="mx-4 md:mx-0 h-44 rounded-2xl bg-gray-100 flex flex-col items-center justify-center text-text-light gap-3">
            <Camera className="w-10 h-10 text-gray-300" />
            <p className="text-sm">Chưa có kỷ niệm nào.</p>
            <Link to="/moments?new=1" className="text-xs text-primary font-medium hover:underline">Tạo moment đầu tiên →</Link>
          </div>
        ) : (
          <Swiper
            modules={[Pagination]}
            slidesPerView={1.15}
            centeredSlides
            spaceBetween={12}
            pagination={{ clickable: true }}
            breakpoints={{
              768: {
                slidesPerView: 3,
                spaceBetween: 16,
                centeredSlides: false,
              },
            }}
            style={{
              '--swiper-pagination-color': '#E8788A',
              '--swiper-pagination-bullet-inactive-color': '#D1D5DB',
              '--swiper-pagination-bullet-inactive-opacity': '1',
              paddingBottom: '2rem',
            } as React.CSSProperties}
          >
            {recentMoments.map((moment) => (
              <SwiperSlide key={moment.id}>
                <Link to={`/moments/${moment.id}`} className="group block">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md">
                    {moment.photos[0] ? (
                      <img
                        src={moment.photos[0].url}
                        alt={moment.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <Camera className="w-10 h-10 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-semibold text-sm leading-snug line-clamp-2 drop-shadow">
                        {moment.title}
                      </p>
                      <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {format(new Date(moment.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
      {/* ── END RECENT MOMENTS ────────────────────────────────────────── */}

      {/* View all moments link */}
      <div className="flex justify-end mb-6">
        <Link to="/moments" className="text-primary text-xs flex items-center gap-1 hover:underline">
          Xem tất cả <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link to={stat.to} className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-text-light text-sm">{stat.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Active Sprint */}
      {activeSprint && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold">Active Sprint</h2>
              <Link to={`/goals/sprint/${activeSprint.id}`} className="text-accent text-sm flex items-center gap-1 hover:underline">
                View <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <h3 className="font-medium">{activeSprint.name}</h3>
            <p className="text-text-light text-xs mt-1">
              {format(new Date(activeSprint.startDate), 'MMM d')} — {format(new Date(activeSprint.endDate), 'MMM d')}
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-light">{doneGoals}/{totalGoals} goals</span>
                <span className="font-medium">{sprintProgress}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${sprintProgress}%` }} />
              </div>
            </div>
            {activeSprint.goals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="flex items-center gap-2 mt-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${goal.status === 'DONE' ? 'bg-green-400' : goal.status === 'IN_PROGRESS' ? 'bg-blue-400' : 'bg-gray-300'}`} />
                <span className={goal.status === 'DONE' ? 'line-through text-text-light' : ''}>{goal.title}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <FAB />
    </div>
  );
}
