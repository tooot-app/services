import { Column, Entity, Index, PrimaryColumn } from 'typeorm'

@Entity()
export class ExpoToken {
  @PrimaryColumn({ update: false, unique: true })
  @Index({ unique: true })
  expoToken!: string

  @Column({ type: 'datetime' })
  connectedTimestamp!: Date

  @Column()
  errorCounts!: number
}
