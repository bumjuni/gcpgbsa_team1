import { Text, View } from "react-native"
import { Badge } from "../../components/badge/Badge"
import { Card } from "../../components/card/Card"
import { Member } from "./ClassMemberScreen";

interface MemberListProps {
  members: Member[];
  onDelete: (id: string) => {};
}

export const MemberList = ({ members, onDelete }: MemberListProps) => {

  return (
    <>
      {members.map((member, index) => (
        <Card
          key={member.id}
          className="flex-row items-center justify-between border border-surface-hairline rounded-md px-md py-sm mb-md"
        >
          {/* 회원정보 */}
          <View className='align-middle flex-row py-xxs'>
            <View className="w-xl h-xl rounded-full bg-status-present-subtle items-center justify-center mr-xs">
              <Text className="text-sm font-bold text-status-present">✓</Text>
            </View>
            <View className='gap-xxs'>
              <Text className="text-button-sm">
                회원 {index + 1} · {member.name}
              </Text>
              <Text className="text-label text-ink-secondary">
                {member.age}세 · {member.level}
                </Text>
            </View>
          </View>

          {/* delete button */}
          <Badge variant='danger' onPress={() => onDelete(member.id)} text='삭제' />
        </Card>
      ))}
    </>
  )
}
