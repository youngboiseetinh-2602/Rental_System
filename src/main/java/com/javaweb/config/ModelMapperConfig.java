package com.javaweb.config;

import com.javaweb.entity.FacilityEntity;
import com.javaweb.entity.RentalPropertyEntity;
import com.javaweb.entity.RoomEntity;
import com.javaweb.entity.RoomTypeEntity;
import com.javaweb.model.request.CreateRentalProperty;
import com.javaweb.model.request.CreateRoom;
import com.javaweb.model.request.CreateRoomType;
import com.javaweb.model.request.FacilityInfo;
import com.javaweb.model.request.UpdateRentalProperty;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ModelMapperConfig {

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();

        modelMapper.typeMap(CreateRentalProperty.class, RentalPropertyEntity.class)
                .addMappings(mapper -> {
                    mapper.skip(RentalPropertyEntity::setOwner);
                    mapper.skip(RentalPropertyEntity::setRentalType);
                    mapper.skip(RentalPropertyEntity::setImages);
                    mapper.skip(RentalPropertyEntity::setRoomTypes);
                });

        modelMapper.typeMap(UpdateRentalProperty.class, RentalPropertyEntity.class)
                .addMappings(mapper -> {
                    mapper.skip(RentalPropertyEntity::setOwner);
                    mapper.skip(RentalPropertyEntity::setRentalType);
                    mapper.skip(RentalPropertyEntity::setImages);
                    mapper.skip(RentalPropertyEntity::setRoomTypes);
                });

        modelMapper.typeMap(CreateRoomType.class, RoomTypeEntity.class)
                .addMappings(mapper -> {
                    mapper.skip(RoomTypeEntity::setRentalProperty);
                    mapper.skip(RoomTypeEntity::setFacilities);
                    mapper.skip(RoomTypeEntity::setRooms);
                });

        modelMapper.typeMap(FacilityInfo.class, FacilityEntity.class)
                .addMappings(mapper -> mapper.skip(FacilityEntity::setRoomType));

        modelMapper.typeMap(CreateRoom.class, RoomEntity.class)
                .addMappings(mapper -> mapper.skip(RoomEntity::setRoomType));

        return modelMapper;
    }
}
