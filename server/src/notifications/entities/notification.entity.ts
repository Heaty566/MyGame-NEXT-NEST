import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

//---- Entity
import User from '../../users/entities/user.entity';

@Entity()
export class Notification {
      @PrimaryGeneratedColumn('uuid')
      id: string;

      @Column({ default: false })
      status: boolean;

      @Column({ default: new Date().toISOString().slice(0, 19).replace('T', ' ') })
      createDate: Date;

      @Column()
      objectTypeId: string;

      @Column()
      notificationType: string;

      @ManyToOne(() => User, (user) => user.notifications)
      receiver: User;
}
