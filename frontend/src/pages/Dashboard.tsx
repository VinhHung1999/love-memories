import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, Camera, Utensils, Target, MapPin, ArrowRight, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { momentsApi, foodSpotsApi, sprintsApi } from '../lib/api';

export default function Dashboard() {
  const { data: moments = [] } = useQuery({ queryKey: ['moments'], queryFn: momentsApi.list });
  const { data: foodSpots = [] } = useQuery({ queryKey: ['foodspots'], queryFn: foodSpotsApi.list });
  const { data: sprints = [] } = useQuery({ queryKey: ['sprints'], queryFn: sprintsApi.list });

  const activeSprint = sprints.find((s) => s.status === 'ACTIVE');
  const recentMoments = moments.slice(0, 4);
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
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-6 h-6 text-primary fill-primary" />
          <h1 className="font-heading text-3xl font-bold">Love Scrum</h1>
        </div>
        <p className="text-text-light">Our little world, beautifully organized</p>
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

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link
          to="/moments?new=1"
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-2xl py-3 text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Moment
        </Link>
        <Link
          to="/foodspots?new=1"
          className="flex-1 flex items-center justify-center gap-2 bg-secondary text-white rounded-2xl py-3 text-sm font-medium hover:bg-secondary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Food Spot
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Recent Moments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold">Recent Moments</h2>
              <Link to="/moments" className="text-primary text-sm flex items-center gap-1 hover:underline">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentMoments.length === 0 ? (
              <p className="text-text-light text-sm py-4 text-center">No moments yet. Start creating memories!</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recentMoments.map((moment) => (
                  <Link key={moment.id} to={`/moments/${moment.id}`} className="group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-1.5">
                      {moment.photos[0] ? (
                        <img src={moment.photos[0].url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{moment.title}</p>
                    <p className="text-xs text-text-light flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(moment.date), 'MMM d')}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
