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

      {/* Hero Timer */}
      <div className="mb-6">
        <RelationshipTimer />
      </div>

      {/* ── RECENT MOMENTS (Swiper) ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-base font-semibold text-text">Kỷ niệm gần đây</h2>
        <Link to="/moments" className="text-primary text-xs flex items-center gap-1 hover:underline">
          Xem tất cả <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="mb-6 -mx-4 md:mx-0">
        {recentMoments.length === 0 ? (
          <div className="mx-4 md:mx-0 h-44 rounded-3xl bg-gray-100 flex flex-col items-center justify-center text-text-light gap-3">
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
                  <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg ring-1 ring-black/5 group-hover:shadow-xl transition-shadow duration-300">
                    {moment.photos[0] ? (
                      <img
                        src={moment.photos[0].url}
                        alt={moment.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                        <Camera className="w-10 h-10 text-primary/30" />
                      </div>
                    )}
                    {/* Smoother gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                    {/* Location or tag badge */}
                    {(moment.location || moment.tags[0]) && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white/90 text-[10px] px-2 py-0.5 rounded-full leading-4">
                          {moment.location ? (
                            <><MapPin className="w-2.5 h-2.5 flex-shrink-0" /><span className="truncate max-w-[80px]">{moment.location.split(',')[0]}</span></>
                          ) : (
                            <span># {moment.tags[0]}</span>
                          )}
                        </span>
                      </div>
                    )}
                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3.5">
                      <p className="text-white font-semibold text-sm leading-snug line-clamp-2 drop-shadow-sm">
                        {moment.title}
                      </p>
                      <p className="text-white/65 text-xs mt-1 flex items-center gap-1">
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
